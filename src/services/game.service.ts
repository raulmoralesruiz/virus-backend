import { Socket } from 'socket.io';

export const startGame = (socket: Socket, roomId: string) => {
  socket.to(roomId).emit('game:start', { message: 'The game has started!' });
  console.log(`🚀 Game started in room ${roomId} by player ${socket.id}`);
};
