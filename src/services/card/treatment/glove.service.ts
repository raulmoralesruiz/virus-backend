import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { GameState, PlayerState, PlayCardResult } from '../../../interfaces/Game.interface.js';

export const playGlove = (g: GameState, ps: PlayerState, cardIdx: number): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!card) {
    return { success: false, error: GAME_ERRORS.NO_CARD };
  }

  for (const p of g.players) {
    if (p.player.id !== ps.player.id) {
      // mover todas las cartas de la mano al descarte
      g.discard.push(...p.hand);
      p.hand = [];

      // actualizar estado público
      const pub = g.public.players.find(pp => pp.player.id === p.player.id);
      if (pub) pub.handCount = 0;
    }
  }

  // descartar la carta de guante
  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
