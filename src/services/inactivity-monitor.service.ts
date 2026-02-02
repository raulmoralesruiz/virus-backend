import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { getRooms } from './room.service.js';
import { getGame } from './game.service.js';
import { removeRoom } from './room.service.js';
import { getIO } from '../ws/io.js';
import { logger } from '../utils/logger.js';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

export const startInactivityMonitor = (intervalMs: number = 60000) => {
  logger.info(`[inactivity-monitor] Starting monitor with interval ${intervalMs}ms`);

  setInterval(() => {
    const rooms = getRooms();
    const now = Date.now();

    for (const room of rooms) {
      // Si la partida no está en curso, no hay timeout de "partida"
      // (aunque podría haber timeout de lobby, pero el requerimiento es sobre partida)
      if (!room.inProgress) continue;

      const game = getGame(room.id);
      if (!game) continue;

      if (now - game.lastActionAt > INACTIVITY_TIMEOUT_MS) {
        logger.info(`[inactivity-monitor] Room ${room.id} inactive for more than 30m. Kicking players.`);

        const io = getIO();

        // 1. Notificar error a clientes
        io.to(room.id).emit(GAME_CONSTANTS.GAME_ERROR, {
          code: 'INACTIVITY_TIMEOUT',
          message: 'La partida ha finalizado por inactividad (30 min)',
        });

        // 2. Notificar fin
        io.to(room.id).emit(GAME_CONSTANTS.GAME_END, {
          roomId: room.id,
          winner: null,
        });

        // 3. Reset room in clients (force exit)
        io.to(room.id).emit(GAME_CONSTANTS.ROOM_RESET, { roomId: room.id });

        // 4. Destroy room (clears game state)
        removeRoom(room.id);
      }
    }
  }, intervalMs);
};
