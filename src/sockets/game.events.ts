import { Server, Socket } from 'socket.io';
import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { startGame, getPublicState, getPlayerHand } from '../services/game.service.js';
import { logger } from '../utils/logger.js';
import { getRooms } from '../services/room.service.js';
import { wsEmitter } from '../ws/emitter.js';
import { _playersStore } from '../services/player.service.js';
import { PlayerHandPayload } from '../interfaces/Game.interface.js';

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
};

export default registerGameEvents;
