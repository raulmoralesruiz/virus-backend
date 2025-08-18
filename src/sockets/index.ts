import { Server, Socket } from 'socket.io';

import registerRoomEvents from './room.events.js';
import registerPlayerEvents from './player.events.js';
import registerGameEvents from './game.events.js';
import { logger } from '../utils/logger.js';

// This function sets up the socket.io server and handles events
// It manages rooms and player connections
// It allows players to create and join rooms, and handles message broadcasting
export default function registerSockets(io: Server) {
  logger.info('Registrando sockets...');

  // io.on('connection', (socket: Socket) => {
  io.on('connect', (socket: Socket) => {
    logger.info(`Cliente conectado: ${socket.id}`);

    registerRoomEvents(io, socket);
    // registerPlayerEvents(io, socket);
    registerGameEvents(io, socket);

    socket.on('disconnect', () => {
      logger.info(`❌ Cliente desconectado: ${socket.id}`);
    });
  });
}
