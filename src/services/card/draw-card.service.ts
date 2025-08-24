import { Card } from '../../interfaces/Card.interface.js';
import { GameState } from '../../interfaces/Game.interface.js';
import { shuffle } from '../deck.service.js';

/**
 * Si el mazo está vacío pero hay descartes, los recicla.
 */
const maybeRecycleDiscard = (g: GameState) => {
  if (g.deck.length === 0 && g.discard.length > 0) {
    g.deck = shuffle(g.discard);
    g.discard = [];
  }
};

/**
 * Acción de robar una carta.
 * Devuelve la carta robada o null si no se pudo.
 */
export const drawCardInternal =
  (games: Map<string, GameState>) =>
  (roomId: string, playerId: string): Card | null => {
    const g = games.get(roomId);
    if (!g) return null;

    maybeRecycleDiscard(g);

    if (g.deck.length === 0) return null;

    const ps = g.players.find(p => p.player.id === playerId);
    if (!ps) return null;

    const card = g.deck.shift()!;
    ps.hand.push(card);

    const pub = g.public.players.find(pp => pp.player.id === playerId);
    if (pub) pub.handCount = ps.hand.length;

    return card;
  };
