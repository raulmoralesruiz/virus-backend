import { Socket } from 'socket.io';

export const startGame = (socket: Socket, roomId: string) => {
  socket.to(roomId).emit('game:start', { message: 'The game has started!' });
};
