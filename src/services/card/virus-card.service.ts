import { CardColor, CardKind } from '../../interfaces/Card.interface.js';
import {
  PlayCardResult,
  PlayCardTarget,
  GameState,
  PlayerState,
} from '../../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../../constants/error.constants.js';
import { canReceiveVirus, isImmune, isInfected } from '../../utils/organ-utils.js';

export const playVirusCard = (
  g: GameState,
  // ps: GameState['players'][0],
  ps: PlayerState,
  cardIdx: number,
  target?: PlayCardTarget
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!target?.playerId || !target?.organId)
    return { success: false, error: GAME_ERRORS.NO_TARGET };

  const targetPub = g.public.players.find(pp => pp.player.id === target.playerId);
  if (!targetPub) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

  const organ = targetPub.board.find(c => c.id === target.organId && c.kind === CardKind.Organ);
  if (!organ) return { success: false, error: GAME_ERRORS.NO_ORGAN };

  if (isImmune(organ)) {
    return { success: false, error: GAME_ERRORS.IMMUNE_ORGAN };
  }

  if (!canReceiveVirus(organ, card)) {
    return { success: false, error: GAME_ERRORS.COLOR_MISMATCH };
  }

  const medIdx = organ.attached.findIndex(
    a =>
      a.kind === CardKind.Medicine &&
      (a.color === card.color || a.color === CardColor.Multi || card.color === CardColor.Multi)
  );

  if (medIdx >= 0) {
    // NEUTRALIZAR → eliminar medicina y virus
    const med = organ.attached.splice(medIdx, 1)[0];
    g.discard.push(med, card);
    ps.hand.splice(cardIdx, 1);

    const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
    if (pubSelf) pubSelf.handCount = ps.hand.length;

    return { success: true };
  }

  if (!isInfected(organ)) {
    // INFECTAR
    organ.attached.push(card);
  } else {
    // EXTIRPAR
    targetPub.board = targetPub.board.filter(c => c.id !== organ.id);
    g.discard.push(organ, ...organ.attached);
  }

  // virus siempre se gasta
  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (pubSelf) pubSelf.handCount = ps.hand.length;

  return { success: true };
};
