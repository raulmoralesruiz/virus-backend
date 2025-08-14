import { Server, Socket } from 'socket.io';
import { startGame } from '../services/game.service.js';

const registerGameEvents = (io: Server, socket: Socket) => {
  socket.on('game:start', (roomId: string) => {
    console.log(`Jugador ${socket.id} iniciando el juego en la sala ${roomId}`);
    startGame(socket, roomId);
  });

  // Additional game-related events can be registered here
};

export default registerGameEvents;
