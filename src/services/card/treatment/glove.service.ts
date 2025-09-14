import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { GameState, PlayerState, PlayCardResult } from '../../../interfaces/Game.interface.js';
import { logger } from '../../../utils/logger.js';

export const playGlove = (g: GameState, ps: PlayerState, cardIdx: number): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!card) {
    return { success: false, error: GAME_ERRORS.NO_CARD };
  }
  logger.info(`__playGlove__ se está jugando`);

  for (const p of g.players) {
    if (p.player.id !== ps.player.id) {
      // mover todas las cartas de la mano al descarte
      g.discard.push(...p.hand);
      p.hand = [];

      // actualizar estado público
      const pub = g.public.players.find(pp => pp.player.id === p.player.id);
      if (pub) pub.handCount = 0;

      // marcar que pierde el siguiente turno
      p.skipNextTurn = true;
    }
  }

  // descartar la carta de guante
  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
