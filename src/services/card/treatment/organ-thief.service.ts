import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind } from '../../../interfaces/Card.interface.js';
import {
  GameState,
  PlayerState,
  PlayCardTarget,
  PlayCardResult,
} from '../../../interfaces/Game.interface.js';
import { isImmune } from '../../../utils/organ-utils.js';

export const playOrganThief = (
  g: GameState,
  ps: PlayerState,
  cardIdx: number,
  target: PlayCardTarget
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!target?.playerId || !target.organId) return { success: false, error: GAME_ERRORS.NO_TARGET };

  const targetPub = g.public.players.find(pp => pp.player.id === target.playerId);
  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (!targetPub || !pubSelf) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

  const organ = targetPub.board.find(c => c.id === target.organId && c.kind === CardKind.Organ);
  if (!organ) return { success: false, error: GAME_ERRORS.NO_ORGAN };
  if (isImmune(organ)) return { success: false, error: GAME_ERRORS.IMMUNE_ORGAN };

  if (pubSelf.board.some(o => o.color === organ.color)) {
    return { success: false, error: GAME_ERRORS.DUPLICATE_ORGAN };
  }

  targetPub.board = targetPub.board.filter(o => o.id !== organ.id);
  pubSelf.board.push(organ);

  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
