import { Server } from 'socket.io';
import { socketConfig } from '../config/socket.config.js';

let io: Server;

export const initIO = (httpServer: any) => {
  io = new Server(httpServer, socketConfig);
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado');
  }
  return io;
};
