import { GameState } from '../../interfaces/Game.interface.js';
import { scheduleTurnTimer } from '../turn-timer.service.js';
import { TURN_DURATION_MS } from '../game.service.js';

/**
 * Verifica si es el turno de un jugador concreto
 */
export const isPlayersTurnInternal =
  (games: Map<string, GameState>) =>
  (roomId: string, playerId: string): boolean => {
    const g = games.get(roomId);
    if (!g) return false;
    return g.players[g.turnIndex]?.player.id === playerId;
  };

/**
 * Avanza el turno al siguiente jugador
 */
export const endTurnInternal =
  (games: Map<string, GameState>, turnTimers: Map<string, NodeJS.Timeout>) =>
  (roomId: string): GameState | null => {
    const g = games.get(roomId);
    if (!g) return null;

    g.turnIndex = (g.turnIndex + 1) % g.players.length;
    const now = Date.now();
    g.turnStartedAt = now;
    g.turnDeadlineTs = now + TURN_DURATION_MS;

    scheduleTurnTimer(roomId, games, turnTimers);
    return g;
  };

/**
 * Limpia todos los datos de una partida y su timer
 */
export const clearGameInternal =
  (games: Map<string, GameState>, turnTimers: Map<string, NodeJS.Timeout>) => (roomId: string) => {
    const timer = turnTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      turnTimers.delete(roomId);
    }
    games.delete(roomId);
  };
