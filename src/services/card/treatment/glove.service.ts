import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { GameState, PlayerState, PlayCardResult } from '../../../interfaces/Game.interface.js';
import { Card } from '../../../interfaces/Card.interface.js';
import { logger } from '../../../utils/logger.js';
import { HAND_LIMIT } from '../draw-card.service.js';
import { shuffle } from '../../deck.service.js';

export const playGlove = (g: GameState, ps: PlayerState, cardIdx: number): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!card) {
    return { success: false, error: GAME_ERRORS.NO_CARD };
  }
  logger.info(`__playGlove__ se está jugando`);

  for (const p of g.players) {
    if (p.player.id !== ps.player.id) {
      const lostHand = [...p.hand];
      if (lostHand.length > 0) {
        g.discard.push(...lostHand);
      }
      p.hand = [];

      refillHandWithNewCards(g, p, lostHand);

      // marcar que pierde el siguiente turno
      p.skipNextTurn = true;
    }
  }

  // descartar la carta de guante
  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};

const refillHandWithNewCards = (g: GameState, player: PlayerState, lostHand: Card[]) => {
  const lostIds = new Set(lostHand.map(card => card.id));
  const reserved: Card[] = [];

  const recycleDiscard = () => {
    if (g.discard.length === 0) return false;

    const recyclable: Card[] = [];
    const remainingDiscard: Card[] = [];

    for (const card of g.discard) {
      if (lostIds.has(card.id)) {
        reserved.push(card);
      } else {
        recyclable.push(card);
      }
    }

    if (recyclable.length === 0) {
      g.discard = [...remainingDiscard];
      return false;
    }

    g.deck = shuffle(recyclable);
    g.discard = remainingDiscard;
    return true;
  };

  const pullCardFromDeck = (): Card | null => {
    while (true) {
      if (g.deck.length === 0) {
        const recycled = recycleDiscard();
        if (!recycled) return null;
      }

      if (g.deck.length === 0) return null;
      const card = g.deck.shift()!;
      if (lostIds.has(card.id)) {
        reserved.push(card);
        continue;
      }
      return card;
    }
  };

  while (player.hand.length < HAND_LIMIT) {
    const card = pullCardFromDeck();
    if (!card) break;
    player.hand.push(card);
  }

  while (player.hand.length < HAND_LIMIT && reserved.length > 0) {
    player.hand.push(reserved.shift()!);
  }

  if (reserved.length > 0) {
    g.discard.push(...reserved);
  }

  const pub = g.public.players.find(pp => pp.player.id === player.player.id);
  if (pub) pub.handCount = player.hand.length;
};
