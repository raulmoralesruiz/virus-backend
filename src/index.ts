import { createServer } from 'http';
import { Server } from 'socket.io';
import setupSockets from './socket';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

setupSockets(io);

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
