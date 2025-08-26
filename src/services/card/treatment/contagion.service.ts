import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind } from '../../../interfaces/Card.interface.js';
import { GameState, PlayerState, PlayCardResult } from '../../../interfaces/Game.interface.js';
import { isImmune } from '../../../utils/organ-utils.js';

export const playContagion = (g: GameState, ps: PlayerState, cardIdx: number): PlayCardResult => {
  const card = ps.hand[cardIdx];
  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (!pubSelf) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

  const myInfected = pubSelf.board.filter(
    o => o.attached.some(a => a.kind === CardKind.Virus) && !isImmune(o)
  );

  for (const organ of myInfected) {
    const viruses = organ.attached.filter(a => a.kind === CardKind.Virus);
    for (const virus of viruses) {
      const targetPub = g.public.players.find(pp =>
        pp.board.some(o => o.color === organ.color && o.attached.length === 0)
      );
      if (targetPub) {
        const targetOrgan = targetPub.board.find(
          o => o.color === organ.color && o.attached.length === 0
        );
        if (targetOrgan) {
          organ.attached = organ.attached.filter(a => a.id !== virus.id);
          targetOrgan.attached.push(virus);
        }
      }
    }
  }

  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
