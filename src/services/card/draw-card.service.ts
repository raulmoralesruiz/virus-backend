import { GAME_ERRORS } from '../../constants/error.constants.js';
import { Card } from '../../interfaces/Card.interface.js';
import { DrawCardResult, GameState } from '../../interfaces/Game.interface.js';
import { logger } from '../../utils/logger.js';
import { shuffle } from '../deck.service.js';

export const HAND_LIMIT = 3;

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
  (roomId: string, playerId: string): DrawCardResult => {
    const g = games.get(roomId);
    if (!g) return { success: false, error: GAME_ERRORS.GAME_NOT_FOUND };

    maybeRecycleDiscard(g);

    if (g.deck.length === 0) {
      return { success: false, error: GAME_ERRORS.NO_CARDS_LEFT };
    }

    const ps = g.players.find(p => p.player.id === playerId);
    if (!ps) return { success: false, error: GAME_ERRORS.NO_PLAYER };

    // limitar 3 cartas en mano
    if (ps.hand.length >= HAND_LIMIT) {
      return { success: false, error: GAME_ERRORS.HAND_LIMIT_REACHED };
    }

    const card = g.deck.shift()!;
    ps.hand.push(card);

    const pub = g.public.players.find(pp => pp.player.id === playerId);
    if (pub) pub.handCount = ps.hand.length;

    return { success: true, card };
  };
