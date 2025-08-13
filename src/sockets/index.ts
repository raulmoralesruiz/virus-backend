import { Server, Socket } from 'socket.io';

import registerRoomEvents from './room.events';
import registerPlayerEvents from './player.events';
import registerGameEvents from './game.events';
import { logger } from '../utils/logger';

// This function sets up the socket.io server and handles events
// It manages rooms and player connections
// It allows players to create and join rooms, and handles message broadcasting
export default function registerSockets(io: Server) {
  logger.info('Registrando sockets...');

  // io.on('connection', (socket: Socket) => {
  io.on('connect', (socket: Socket) => {
    logger.info(`Cliente conectado: ${socket.id}`);

    registerRoomEvents(io, socket);
    registerPlayerEvents(io, socket);
    registerGameEvents(io, socket);

    socket.on('disconnect', () => {
      logger.info(`❌ Cliente desconectado: ${socket.id}`);
    });

    // socket.on('disconnect', () => {
    //   rooms.forEach(room => {
    //     room.players = room.players.filter(p => p.socketId !== socket.id);
    //   });
    //   console.log(`Jugador desconectado: ${socket.id}`);
    // });

    // socket.on('createRoom', (playerName: string, callback: (roomId: string) => void) => {
    //   console.log(`Jugador ${playerName} creando sala`);

    //   const roomId = randomUUID();
    //   const newPlayer: Player = {
    //     id: randomUUID(),
    //     name: playerName,
    //     socketId: socket.id,
    //     roomId,
    //   };
    //   const newRoom: Room = {
    //     id: roomId,
    //     players: [newPlayer],
    //   };
    //   rooms.push(newRoom);
    //   socket.join(roomId);
    //   callback(roomId);
    //   io.to(roomId).emit('roomData', newRoom);
    // });

    // socket.on(
    //   'joinRoom',
    //   (roomId: string, playerName: string, callback: (success: boolean) => void) => {
    //     console.log(`Jugador ${playerName} intentando unirse a la sala ${roomId}`);
    //     const room = rooms.find(r => r.id === roomId);
    //     if (!room) {
    //       callback(false);
    //       return;
    //     }
    //     const newPlayer: Player = {
    //       id: randomUUID(),
    //       name: playerName,
    //       socketId: socket.id,
    //       roomId,
    //     };
    //     room.players.push(newPlayer);
    //     socket.join(roomId);
    //     callback(true);
    //     io.to(roomId).emit('roomData', room);
    //   }
    // );
  });
}
