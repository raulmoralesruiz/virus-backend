import { Server, Socket } from 'socket.io';
import { GAME_CONSTANTS } from '../constants/game.constants.js';
import {
  startGame,
  getPublicState,
  getPlayerHand,
  drawCard,
  isPlayersTurn,
  endTurn,
  playCard,
} from '../services/game.service.js';
import { logger } from '../utils/logger.js';
import { getRooms } from '../services/room.service.js';
import { PlayCardTarget, PlayerHandPayload } from '../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../constants/error.constants.js';

const registerGameEvents = (io: Server, socket: Socket) => {
  socket.on(GAME_CONSTANTS.GAME_START, ({ roomId }) => {
    logger.info(`${GAME_CONSTANTS.GAME_START} - roomId=${roomId}`);

    const room = getRooms().find(r => r.id === roomId);
    if (!room) return;

    // 🔒 Solo host puede iniciar
    const requesterId = socket.data?.playerId;
    if (!requesterId || room.hostId !== requesterId) {
      logger.warn(`Non-host tried to start game in room ${roomId} (requester=${requesterId})`);
      return;
    }

    const players = room.players;
    startGame(roomId, players);

    // Estado público inicial
    const publicState = getPublicState(roomId);
    // notificar a todos los de la sala que la partida empezó
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STARTED, publicState);

    // Mano privada: enviamos a cada jugador por su socketId
    for (const pl of players) {
      if (!pl.socketId) continue; // seguridad
      const hand = getPlayerHand(roomId, pl.id) || [];

      const payload: PlayerHandPayload = { roomId, playerId: pl.id, hand };
      io.to(pl.socketId).emit(GAME_CONSTANTS.GAME_HAND, payload);
    }

    logger.info(`${GAME_CONSTANTS.GAME_STARTED} - roomId=${roomId}`);
  });

  socket.on(GAME_CONSTANTS.GAME_GET_STATE, ({ roomId }) => {
    const publicState = getPublicState(roomId);
    socket.emit(GAME_CONSTANTS.GAME_STATE, publicState);
  });

  // robar carta
  socket.on(GAME_CONSTANTS.GAME_DRAW, ({ roomId }: { roomId: string }) => {
    const playerId = socket.data?.playerId as string | undefined;

    if (!playerId) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} Jugador no identificado`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.PLAYER_NOT_IDENTIFIED);
      return;
    }

    const room = getRooms().find(r => r.id === roomId);
    if (!room) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} Sala no existe`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.ROOM_NOT_FOUND);
      return;
    }

    const playerInRoom = room.players.some(p => p.id === playerId);
    if (!playerInRoom) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} No perteneces a esta sala`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_IN_ROOM);
      return;
    }

    const state = getPublicState(roomId);
    if (!state) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} Partida no encontrada`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.GAME_NOT_FOUND);
      return;
    }

    if (!isPlayersTurn(roomId, playerId)) {
      logger.warn(`[game:draw] Jugador ${playerId} intentó robar fuera de turno`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
      return;
    }

    const card = drawCard(roomId, playerId);
    if (!card) {
      logger.warn(`${GAME_CONSTANTS.GAME_ERROR} No hay cartas para robar`);
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_CARDS_LEFT);
      return;
    }

    // mano privada al jugador
    const hand = getPlayerHand(roomId, playerId) || [];
    const payload: PlayerHandPayload = { roomId, playerId, hand };
    socket.emit(GAME_CONSTANTS.GAME_HAND, payload);

    // estado público a toda la sala
    const publicState = getPublicState(roomId);
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, publicState);
  });

  socket.on(GAME_CONSTANTS.GAME_GET_STATE, ({ roomId }) => {
    const publicState = getPublicState(roomId);
    socket.emit(GAME_CONSTANTS.GAME_STATE, publicState);
  });

  // Finalizar turno (solo jugador activo)
  socket.on(GAME_CONSTANTS.GAME_END_TURN, ({ roomId }) => {
    const pid = socket.data?.playerId;
    if (!pid) return;

    if (!isPlayersTurn(roomId, pid)) {
      socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
      return;
    }

    endTurn(roomId);
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, getPublicState(roomId));
  });

  socket.on(
    GAME_CONSTANTS.GAME_PLAY_CARD,
    (data: { roomId: string; cardId: string; target?: PlayCardTarget }) => {
      const { roomId, cardId, target } = data || {};
      const playerId = socket.data?.playerId;

      logger.info(
        `[${
          GAME_CONSTANTS.GAME_PLAY_CARD
        }] room=${roomId} player=${playerId} card=${cardId} target=${
          target ? JSON.stringify(target) : '—'
        }`
      );

      if (!playerId) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_PLAYER);
        return;
      }

      const room = getRooms().find(r => r.id === roomId);
      if (!room) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_ROOM);
        return;
      }

      const playerInRoom = room.players.some(p => p.id === playerId);
      if (!playerInRoom) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_IN_ROOM);
        return;
      }

      if (!isPlayersTurn(roomId, playerId)) {
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
        return;
      }

      try {
        const result = playCard(roomId, playerId, cardId, target);
        if (!result.success) {
          socket.emit(GAME_CONSTANTS.GAME_ERROR, result.error);
          return;
        }

        // mano privada al jugador
        const hand = getPlayerHand(roomId, playerId) || [];
        const payload: PlayerHandPayload = { roomId, playerId, hand };
        socket.emit(GAME_CONSTANTS.GAME_HAND, payload);

        // estado público a todos
        io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, getPublicState(roomId));
      } catch (err: any) {
        logger.error(`[${GAME_CONSTANTS.GAME_PLAY_CARD}] ${err?.message || err}`);
        socket.emit(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.SERVER_ERROR);
      }
    }
  );
};

export default registerGameEvents;
