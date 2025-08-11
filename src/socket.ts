import { Server, Socket } from 'socket.io';

export default function setupSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    socket.on('message', data => {
      console.log('Mensaje recibido:', data);
      io.emit('message', data); // reenvía a todos
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
}
