import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { Card, CardKind } from '../../../interfaces/Card.interface.js';
import {
  GameState,
  PlayCardResult,
  PlayerState,
  FailedExperimentTarget,
  OrganOnBoard,
} from '../../../interfaces/Game.interface.js';
import { isImmune, isVaccinated, isInfected } from '../../../utils/organ-utils.js';

export const playFailedExperiment = (
  g: GameState,
  ps: PlayerState,
  cardIdx: number,
  target: FailedExperimentTarget
): PlayCardResult => {
  const card = ps.hand[cardIdx];

  if (!target?.playerId || !target.organId || !target.action) {
    return { success: false, error: GAME_ERRORS.NO_TARGET };
  }

  const targetPlayer = g.public.players.find(p => p.player.id === target.playerId);
  if (!targetPlayer) {
    return { success: false, error: GAME_ERRORS.INVALID_TARGET };
  }

  const organ = targetPlayer.board.find(o => o.id === target.organId);
  if (!organ) {
    return { success: false, error: GAME_ERRORS.NO_ORGAN };
  }

  if (!isInfected(organ) && !isVaccinated(organ)) {
    return { success: false, error: GAME_ERRORS.ORGAN_NOT_INFECTED_OR_VACCINATED };
  }

  switch (target.action) {
    case 'cure':
      if (!isInfected(organ)) {
        return { success: false, error: GAME_ERRORS.ORGAN_NOT_INFECTED };
      }
      const virusIdx = organ.attached.findIndex(c => c.kind === CardKind.Virus);
      if (virusIdx > -1) {
        const [removed] = organ.attached.splice(virusIdx, 1);
        g.discard.push(removed);
      }
      break;

    case 'extirpate':
      const organCard: Card = { id: organ.id, kind: organ.kind, color: organ.color };
      g.discard.push(organCard, ...organ.attached);
      targetPlayer.board = targetPlayer.board.filter(o => o.id !== organ.id);
      break;

    case 'remove-medicine':
      if (!isVaccinated(organ)) {
        return { success: false, error: GAME_ERRORS.ORGAN_NOT_VACCINATED };
      }
      const medIdx = organ.attached.findIndex(c => c.kind === CardKind.Medicine);
      if (medIdx > -1) {
        const [removed] = organ.attached.splice(medIdx, 1);
        g.discard.push(removed);
      }
      break;

    case 'immunize':
      if (isImmune(organ)) {
        return { success: false, error: GAME_ERRORS.ALREADY_IMMUNE };
      }
      const playedCard = ps.hand.splice(cardIdx, 1)[0];
      const vaccine: Card = { ...playedCard, kind: CardKind.Medicine, color: organ.color, subtype: undefined };
      organ.attached.push(vaccine);
      return { success: true };

    default:
      return { success: false, error: GAME_ERRORS.INVALID_ACTION };
  }

  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};