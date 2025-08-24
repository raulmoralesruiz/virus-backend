import { Card } from '../../interfaces/Card.interface.js';
import { GameState } from '../../interfaces/Game.interface.js';

/**
 * Devuelve el estado público de la partida (lo que verán todos los jugadores).
 */
export const getPublicStateInternal = (games: Map<string, GameState>) => (roomId: string) => {
  const g = games.get(roomId);
  if (!g) return null;
  return {
    roomId: g.roomId,
    startedAt: g.startedAt,
    discardCount: g.discard.length,
    deckCount: g.deck.length,
    players: g.public.players,
    turnIndex: g.turnIndex,
    turnDeadlineTs: g.turnDeadlineTs,
  };
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
