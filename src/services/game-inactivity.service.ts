import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { logger } from '../utils/logger.js';
import { getIO } from '../ws/io.js';
import { removeRoom } from './room.service.js';

// Mapa para guardar los timers de inactividad por sala
const inactivityTimers = new Map<string, NodeJS.Timeout>();

// 30 minutos
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export const clearInactivityTimer = (roomId: string) => {
  const timer = inactivityTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    inactivityTimers.delete(roomId);
    // logger.debug(`[inactivity] Timer cleared for room ${roomId}`);
  }
};

export const scheduleInactivityTimer = (roomId: string) => {
  // Limpiar anterior si existe
  clearInactivityTimer(roomId);

  // logger.debug(`[inactivity] Scheduling timer for room ${roomId} in ${INACTIVITY_TIMEOUT_MS}ms`);

  const timer = setTimeout(() => {
    logger.info(`[inactivity] Timeout reached for room ${roomId}. Ending game...`);

    const io = getIO();

    // 1. Notificar error a todos (Toast o similar)
    io.to(roomId).emit(GAME_CONSTANTS.GAME_ERROR, {
      code: 'INACTIVITY_TIMEOUT',
      message: 'La partida ha finalizado por inactividad (30 min)',
    });

    // 2. Notificar fin de partida (sin ganador)
    io.to(roomId).emit(GAME_CONSTANTS.GAME_END, {
      roomId,
      winner: null,
    });

    // 3. Forzar reseteo de sala en clientes (vuelta al lobby/home)
    io.to(roomId).emit(GAME_CONSTANTS.ROOM_RESET, { roomId });

    // 4. Eliminar la sala y limpiar estado del juego
    // removeRoom llama internamente a clearGame, que debería llamar a clearInactivityTimer
    // pero por seguridad lo hacemos antes o confiamos en el flujo.
    // Al llamar a removeRoom, se destruye todo.
    removeRoom(roomId);

  }, INACTIVITY_TIMEOUT_MS);

  inactivityTimers.set(roomId, timer);
};
