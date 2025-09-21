import express from 'express';
import { createServer } from 'http';
import cors from 'cors';

import registerSockets from './sockets/index.js';
import { socketConfig } from './config/socket.config.js';
import { logger } from './utils/logger.js';
import apiRouter from './api/index.js'; // nuevo: carpeta con controladores REST
import { initIO } from './ws/io.js';

const app = express();

// Middleware
app.use(cors(socketConfig.cors));
app.use(express.json());

// Rutas API REST
app.use('/api', apiRouter);

// Ruta health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Servidor HTTP + WS
const httpServer = createServer(app);
const io = initIO(httpServer);

// Registro de eventos WS
registerSockets(io);

const PORT = 3000;
httpServer.listen(PORT, () => {
  logger.info(`Servidor escuchando en http://localhost:${PORT}`);
});

export { io }; // opcional, para emitir eventos desde controladores
