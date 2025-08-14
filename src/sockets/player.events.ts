import { Server, Socket } from 'socket.io';
import { createPlayer, getPlayerById } from '../services/player.service.js';
import { logger } from '../utils/logger.js';
import { PLAYER_CONSTANTS } from '../constants/player.constants.js';

const registerPlayerEvents = (io: Server, socket: Socket) => {
  logger.info(`Registrando eventos de jugador para el socket: ${socket.id}`);

  // Create a new player
  socket.on(PLAYER_CONSTANTS.PLAYER_NEW, (name: string) => {
    logger.info(`${PLAYER_CONSTANTS.PLAYER_NEW} - Creando jugador con nombre: ${name}`);

    const player = createPlayer(name);
    socket.emit(PLAYER_CONSTANTS.PLAYER_CREATED, player);
  });

  // get player by ID
  socket.on(PLAYER_CONSTANTS.PLAYER_GET_BY_ID, (id: string) => {
    logger.info(`${PLAYER_CONSTANTS.PLAYER_GET_BY_ID} - Buscando jugador con ID: ${id}`);

    const player = getPlayerById(id);
    if (player) {
      socket.emit(PLAYER_CONSTANTS.PLAYER_FOUND, player);
      logger.info(`Jugador encontrado: ${JSON.stringify(player)}`);
    } else {
      socket.emit(PLAYER_CONSTANTS.PLAYER_NOT_FOUND, { id });
      logger.warn(`Jugador con ID ${id} no encontrado`);
    }
  });
};

export default registerPlayerEvents;
