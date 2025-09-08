import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardColor, CardKind } from '../../../interfaces/Card.interface.js';
import {
  GameState,
  PlayerState,
  PlayCardResult,
  ContagionTarget,
} from '../../../interfaces/Game.interface.js';
import { isImmune, isInfected } from '../../../utils/organ-utils.js';

export const playContagion = (
  g: GameState,
  ps: PlayerState,
  cardIdx: number,
  targets: ContagionTarget[]
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!targets || targets.length === 0) {
    return { success: false, error: GAME_ERRORS.NO_TARGET };
  }

  for (const t of targets) {
    const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
    const pubFrom = pubSelf?.board.find(o => o.id === t.fromOrganId && o.kind === CardKind.Organ);
    if (!pubFrom) return { success: false, error: GAME_ERRORS.NO_ORGAN };

    const virusIdx = pubFrom.attached.findIndex(a => a.kind === CardKind.Virus);
    if (virusIdx === -1) continue; // no hay virus disponible

    const pubTarget = g.public.players.find(pp => pp.player.id === t.toPlayerId);
    if (!pubTarget) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

    const organTarget = pubTarget.board.find(
      o => o.id === t.toOrganId && o.kind === CardKind.Organ
    );
    if (!organTarget) return { success: false, error: GAME_ERRORS.NO_ORGAN };

    // debe ser órgano libre (ni inmune, ni infectado, ni vacunado)
    if (isImmune(organTarget)) {
      return { success: false, error: GAME_ERRORS.IMMUNE_ORGAN };
    }
    if (isInfected(organTarget) || organTarget.attached.some(a => a.kind === CardKind.Medicine)) {
      return { success: false, error: GAME_ERRORS.INVALID_TARGET };
    }

    // comprobar color del virus vs órgano destino
    const virus = pubFrom.attached[virusIdx];
    if (
      virus.color !== organTarget.color &&
      virus.color !== CardColor.Multi &&
      organTarget.color !== CardColor.Multi
    ) {
      return { success: false, error: GAME_ERRORS.COLOR_MISMATCH };
    }

    // mover virus
    pubFrom.attached.splice(virusIdx, 1);
    organTarget.attached.push(virus);
  }

  // descartar la carta jugada
  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
