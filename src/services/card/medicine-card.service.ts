import { CardColor, CardKind } from '../../interfaces/Card.interface.js';
import { PlayCardResult, PlayCardTarget, GameState } from '../../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../../constants/error.constants.js';
import { canReceiveMedicine, isImmune, isInfected } from '../../utils/organ-utils.js';
import { logger } from '../../utils/logger.js';

export const playMedicineCard = (
  g: GameState,
  ps: GameState['players'][0],
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
    return { success: false, error: GAME_ERRORS.ALREADY_IMMUNE };
  }

  if (!canReceiveMedicine(organ, card)) {
    return { success: false, error: GAME_ERRORS.COLOR_MISMATCH };
  }

  // Si hay virus + medicina → neutralizar
  if (isInfected(organ)) {
    // eliminar un virus del mismo color y la medicina jugada
    const virusIdx = organ.attached.findIndex(
      a =>
        a.kind === CardKind.Virus &&
        (a.color === card.color || a.color === CardColor.Multi || card.color === CardColor.Multi)
    );

    if (virusIdx >= 0) {
      const virus = organ.attached.splice(virusIdx, 1)[0];
      g.discard.push(virus, card);
      ps.hand.splice(cardIdx, 1);
      return { success: true };
    }
  }

  // VACUNAR → añadir medicina
  organ.attached.push(card);
  ps.hand.splice(cardIdx, 1);

  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (pubSelf) pubSelf.handCount = ps.hand.length;

  return { success: true };
};
