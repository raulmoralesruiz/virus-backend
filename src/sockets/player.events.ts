import { Server, Socket } from 'socket.io';
import {
  clearPlayerSocketId,
  getPlayerById,
  setPlayerSocketId,
} from '../services/player.service.js';
import { logger } from '../utils/logger.js';
import { PLAYER_CONSTANTS } from '../constants/player.constants.js';

const registerPlayerEvents = (io: Server, socket: Socket) => {
  logger.info(`Registrando eventos de jugador para el socket: ${socket.id}`);

  socket.on(PLAYER_CONSTANTS.PLAYER_IDENTIFY, ({ playerId }) => {
    const player = getPlayerById(playerId);
    if (!player) {
      logger.warn(`[player:identify] Player not found: ${playerId}`);
      return;
    }
    socket.data.playerId = playerId; // 🔗 liga el socket al player
    setPlayerSocketId(playerId, socket.id); // guarda socketId en el jugador
    socket.emit(PLAYER_CONSTANTS.PLAYER_IDENTIFIED, { ok: true });
    logger.info(`[player:identify] ${player.name} (${playerId}) -> ${socket.id}`);
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
