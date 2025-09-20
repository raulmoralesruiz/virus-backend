import { Card } from '../../interfaces/Card.interface.js';
import { GameState, PublicGameState } from '../../interfaces/Game.interface.js';
import { logger } from '../../utils/logger.js';

// función reutilizable
export const mapToPublicState = (g: GameState): PublicGameState => {
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((g.turnDeadlineTs - now) / 1000));

  return {
    roomId: g.roomId,
    startedAt: g.startedAt,
    discardCount: g.discard.length,
    deckCount: g.deck.length,
    players: g.public.players,
    turnIndex: g.turnIndex,
    turnDeadlineTs: g.turnDeadlineTs,
    remainingSeconds: remaining,
    winner: g.winner,
    history: g.history,
  };
};

/**
 * Devuelve el estado público de la partida (lo que verán todos los jugadores).
 */
export const getPublicStateInternal =
  (games: Map<string, GameState>) =>
  (roomId: string): PublicGameState | null => {
    const g = games.get(roomId);
    if (!g) return null;
    return mapToPublicState(g);
  };

/**
 * Devuelve la mano privada de un jugador.
 */
export const getPlayerHandInternal =
  (games: Map<string, GameState>) =>
  (roomId: string, playerId: string): Card[] | null => {
    const g = games.get(roomId);
    if (!g) return null;
    const ps = g.players.find(p => p.player.id === playerId);
    return ps ? ps.hand : null;
  };
