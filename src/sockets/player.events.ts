import { Server, Socket } from 'socket.io';
import { createPlayer, getPlayerById } from '../services/player.service';
import { logger } from '../utils/logger';
import { PLAYER_CONSTANTS } from '../constants/player.constants';

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

  // // Placeholder for player-related events
  // socket.on('player:action', (action: any) => {
  //   console.log(`Jugador ${socket.id} realizó una acción:`, action);

  //   // Handle player action
  //   io.emit('player:actionResponse', { playerId: socket.id, action });
  // });
};

export default registerPlayerEvents;
