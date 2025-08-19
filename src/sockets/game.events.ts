// backend/src/sockets/game.events.ts
import { Server, Socket } from 'socket.io';
import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { startGame, getPublicState, getPlayerHand } from '../services/game.service.js';
import { logger } from '../utils/logger.js';
import { getRooms } from '../services/room.service.js';
import { wsEmitter } from '../ws/emitter.js';

const registerGameEvents = (io: Server, socket: Socket) => {
  socket.on(GAME_CONSTANTS.GAME_START, ({ roomId }) => {
    logger.info(`${GAME_CONSTANTS.GAME_START} - roomId=${roomId}`);

    const room = getRooms().find(r => r.id === roomId);
    if (!room) return;

    // IMPORTANTE: asegúrate de que los sockets de los jugadores estén unidos al roomId
    // en tus eventos de unión de sala haces: socket.join(roomId)

    const players = room.players;
    const game = startGame(roomId, players);

    // Estado público para todos en la sala
    const publicState = getPublicState(roomId);
    wsEmitter.emitGameState(roomId, publicState);

    // Mano privada a cada jugador (si conoces socketId por jugador, úsalo; de lo contrario, envía al socket iniciador su mano)
    // Versión mínima: al socket iniciador (deberíamos mejorar con un mapa playerId->socketId)
    const requesterPlayerId = socket.data?.playerId; // si lo guardaste al crear jugador
    if (requesterPlayerId) {
      const hand = getPlayerHand(roomId, requesterPlayerId) || [];
      socket.emit(GAME_CONSTANTS.GAME_HAND, { roomId, playerId: requesterPlayerId, hand });
    } else {
      // fallback: al menos enviamos la mano del primer jugador al solicitante
      const firstId = players[0].id;
      const hand = getPlayerHand(roomId, firstId) || [];
      socket.emit(GAME_CONSTANTS.GAME_HAND, { roomId, playerId: firstId, hand });
    }

    logger.info(`${GAME_CONSTANTS.GAME_STARTED} - roomId=${roomId}`);
  });

  socket.on(GAME_CONSTANTS.GAME_GET_STATE, ({ roomId }) => {
    const publicState = getPublicState(roomId);
    socket.emit(GAME_CONSTANTS.GAME_STATE, publicState);
  });
};

export default registerGameEvents;
