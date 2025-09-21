import { GameState } from '../../interfaces/Game.interface.js';
import { scheduleTurnTimer } from '../turn-timer.service.js';
import { TURN_DURATION_MS } from '../../constants/turn.constants.js';
import { drawCardInternal, HAND_LIMIT } from '../card/draw-card.service.js';

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

    // avanzar turno
    g.turnIndex = (g.turnIndex + 1) % g.players.length;
    let nextPlayer = g.players[g.turnIndex];

    // si el jugador debe saltarse el turno (ej. Guantes de Látex)
    if (nextPlayer.skipNextTurn) {
      nextPlayer.skipNextTurn = false;

      // Roba cartas hasta recomponer mano respetando HAND_LIMIT.
      const drawCard = drawCardInternal(games);
      while (nextPlayer.hand.length < HAND_LIMIT) {
        const result = drawCard(roomId, nextPlayer.player.id);
        if (!result.success) break;
      }

      // actualizar estado público
      const pub = g.public.players.find(p => p.player.id === nextPlayer.player.id);
      if (pub) pub.handCount = nextPlayer.hand.length;

      // pasar turno al siguiente jugador real
      return endTurnInternal(games, turnTimers)(roomId);
    }

    const now = Date.now();
    g.turnStartedAt = now;
    g.turnDeadlineTs = now + TURN_DURATION_MS;

    scheduleTurnTimer(roomId, games, turnTimers, endTurnInternal(games, turnTimers));
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
