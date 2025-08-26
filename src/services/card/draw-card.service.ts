import { Card } from '../../interfaces/Card.interface.js';
import { GameState } from '../../interfaces/Game.interface.js';
import { logger } from '../../utils/logger.js';
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

    // limitar 3 cartas en mano // TODO! mejorar error
    const hand = ps.hand;
    if (hand.length === 3) {
      logger.warn(`${ps.player.name} no puede robar, ya tiene 3 cartas.`);
      return null;
    }

    // if (isImmune(organ)) {
    //   return { success: false, error: GAME_ERRORS.ALREADY_IMMUNE };
    // }

    const card = g.deck.shift()!;
    ps.hand.push(card);

    const pub = g.public.players.find(pp => pp.player.id === playerId);
    if (pub) pub.handCount = ps.hand.length;

    return card;
  };
