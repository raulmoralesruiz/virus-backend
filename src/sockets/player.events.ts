import { Server, Socket } from 'socket.io';
import {
  clearPlayerSocketId,
  getPlayerById,
  setPlayerSocketId,
} from '../services/player.service.js';
import { logger } from '../utils/logger.js';
import { PLAYER_CONSTANTS } from '../constants/player.constants.js';
import { getRooms } from '../services/room.service.js';
import { wsEmitter } from '../ws/emitter.js';
import {
  getGame,
  getPlayerHand,
  getPublicState,
} from '../services/game.service.js';
import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { PlayerHandPayload } from '../interfaces/Game.interface.js';
import { ROOM_CONSTANTS } from '../constants/room.constants.js';

const registerPlayerEvents = (io: Server, socket: Socket) => {
  logger.info(`Registrando eventos de jugador para el socket: ${socket.id}`);

  const attachSocketToPlayer = (playerId: string, source: string) => {
    const player = getPlayerById(playerId);
    if (!player) {
      logger.warn(`[${source}] Player not found: ${playerId}`);
      return null;
    }

    socket.data.playerId = playerId; // 🔗 liga el socket al player
    setPlayerSocketId(playerId, socket.id); // guarda socketId en el jugador
    logger.info(`[${source}] ${player.name} (${playerId}) -> ${socket.id}`);

    return player;
  };

  socket.on(PLAYER_CONSTANTS.PLAYER_IDENTIFY, ({ playerId }) => {
    const player = attachSocketToPlayer(playerId, PLAYER_CONSTANTS.PLAYER_IDENTIFY);
    if (!player) return;

    socket.emit(PLAYER_CONSTANTS.PLAYER_IDENTIFIED, { ok: true });
  });

  socket.on(PLAYER_CONSTANTS.PLAYER_RECONNECT, ({ playerId }) => {
    const player = attachSocketToPlayer(playerId, PLAYER_CONSTANTS.PLAYER_RECONNECT);
    if (!player) return;

    const room = getRooms().find(r => r.players.some(pl => pl.id === playerId));
    if (room) {
      socket.join(room.id);
      wsEmitter.emitRoomUpdated(room.id);
      socket.emit(ROOM_CONSTANTS.ROOM_JOINED, room);

      const publicState = getPublicState(room.id);
      if (publicState) socket.emit(GAME_CONSTANTS.GAME_STATE, publicState);

      const hand = getPlayerHand(room.id, playerId) || [];
      const payload: PlayerHandPayload = { roomId: room.id, playerId, hand };
      socket.emit(GAME_CONSTANTS.GAME_HAND, payload);

      const game = getGame(room.id);
      if (game?.winner) {
        socket.emit(GAME_CONSTANTS.GAME_END, { roomId: room.id, winner: game.winner });
      }
    }

    socket.emit(PLAYER_CONSTANTS.PLAYER_IDENTIFIED, {
      ok: true,
      reconnected: true,
    });
  });

  socket.on('disconnect', () => {
    clearPlayerSocketId(socket.id);
  });

  // // Create a new player
  // socket.on(PLAYER_CONSTANTS.PLAYER_NEW, (name: string) => {
  //   logger.info(`${PLAYER_CONSTANTS.PLAYER_NEW} - Creando jugador con nombre: ${name}`);

  //   const player = createPlayer(name);
  //   socket.emit(PLAYER_CONSTANTS.PLAYER_CREATED, player);
  // });

  // // get player by ID
  // socket.on(PLAYER_CONSTANTS.PLAYER_GET_BY_ID, (id: string) => {
  //   logger.info(`${PLAYER_CONSTANTS.PLAYER_GET_BY_ID} - Buscando jugador con ID: ${id}`);

  //   const player = getPlayerById(id);
  //   if (player) {
  //     socket.emit(PLAYER_CONSTANTS.PLAYER_FOUND, player);
  //     logger.info(`Jugador encontrado: ${JSON.stringify(player)}`);
  //   } else {
  //     socket.emit(PLAYER_CONSTANTS.PLAYER_NOT_FOUND, { id });
  //     logger.warn(`Jugador con ID ${id} no encontrado`);
  //   }
  // });
};

export default registerPlayerEvents;
