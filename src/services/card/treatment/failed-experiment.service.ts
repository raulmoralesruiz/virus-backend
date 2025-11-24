import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { Card, CardColor, CardKind } from '../../../interfaces/Card.interface.js';
import {
  GameState,
  PlayCardResult,
  PlayerState,
  FailedExperimentTarget,
} from '../../../interfaces/Game.interface.js';
import { isVaccinated, isInfected } from '../../../utils/organ-utils.js';
import { playMedicineCard } from '../medicine-card.service.js';
import { playVirusCard } from '../virus-card.service.js';

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

  // RESTRICCIÓN: Solo sobre órgano infectado o vacunado
  if (!isInfected(organ) && !isVaccinated(organ)) {
    return { success: false, error: GAME_ERRORS.ORGAN_NOT_INFECTED_OR_VACCINATED };
  }

  // Modificamos temporalmente la carta en mano para que actúe como Medicina o Virus Multicolor
  const originalKind = card.kind;
  const originalColor = card.color;

  try {
    if (target.action === 'medicine') {
      card.kind = CardKind.Medicine;
      card.color = CardColor.Multi;
      const res = playMedicineCard(g, ps, cardIdx, { playerId: target.playerId, organId: target.organId });
      
      // Si falló, restauramos la carta
      if (!res.success) {
        card.kind = originalKind;
        card.color = originalColor;
      }
      return res;
    } 
    
    if (target.action === 'virus') {
      card.kind = CardKind.Virus;
      card.color = CardColor.Multi;
      const res = playVirusCard(g, ps, cardIdx, { playerId: target.playerId, organId: target.organId });

      // Si falló, restauramos la carta
      if (!res.success) {
        card.kind = originalKind;
        card.color = originalColor;
      }
      return res;
    }

    return { success: false, error: GAME_ERRORS.INVALID_ACTION };

  } catch (error) {
    // Por si acaso explota algo, restauramos
    card.kind = originalKind;
    card.color = originalColor;
    throw error;
  }
};