import { GameState, PlayerState, PlayCardResult } from '../../../interfaces/Game.interface.js';

export const playGlove = (g: GameState, ps: PlayerState, cardIdx: number): PlayCardResult => {
  const card = ps.hand[cardIdx];

  for (const p of g.players) {
    if (p.player.id !== ps.player.id) {
      g.discard.push(...p.hand);
      p.hand = [];
      const pub = g.public.players.find(pp => pp.player.id === p.player.id);
      if (pub) pub.handCount = 0;
    }
  }

  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
