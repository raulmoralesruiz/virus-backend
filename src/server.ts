import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import registerSockets from './sockets';
import { socketConfig } from './config/socket.config';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, socketConfig);

registerSockets(io);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  logger.info(`Servidor escuchando en http://localhost:${PORT}`);
});
