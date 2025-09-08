import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardColor, CardKind, Card, TreatmentSubtype } from '../../interfaces/Card.interface.js';
import {
  PlayCardResult,
  PlayCardTarget,
  GameState,
  TransplantTarget,
} from '../../interfaces/Game.interface.js';

import { playOrganCard } from './organ-card.service.js';
import { playMedicineCard } from './medicine-card.service.js';
import { playVirusCard } from './virus-card.service.js';
import { playTransplant } from './treatment/transplant.service.js';
import { playOrganThief } from './treatment/organ-thief.service.js';
import { playContagion } from './treatment/contagion.service.js';
import { playGlove } from './treatment/glove.service.js';
import { playMedicalError } from './treatment/medical-error.service.js';

export const playCardInternal =
  (games: Map<string, GameState>) =>
  (
    roomId: string,
    playerId: string,
    cardId: string,
    target?: PlayCardTarget | TransplantTarget
  ): PlayCardResult => {
    const g = games.get(roomId);
    if (!g) return { success: false, error: GAME_ERRORS.NO_GAME };

    const ps = g.players.find(p => p.player.id === playerId);
    if (!ps) return { success: false, error: GAME_ERRORS.NO_PLAYER };

    const cardIdx = ps.hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return { success: false, error: GAME_ERRORS.NO_CARD };

    const card = ps.hand[cardIdx];

    switch (card.kind) {
      case CardKind.Organ:
        return playOrganCard(g, ps, cardIdx);

      case CardKind.Virus: {
        const t = requireSimpleTarget(target);
        if (!t) return { success: false, error: GAME_ERRORS.NO_TARGET };
        return playVirusCard(g, ps, cardIdx, t);
      }

      case CardKind.Medicine: {
        const t = requireSimpleTarget(target);
        if (!t) return { success: false, error: GAME_ERRORS.NO_TARGET };
        return playMedicineCard(g, ps, cardIdx, t);
      }

      case CardKind.Treatment:
        switch (card.subtype) {
          case TreatmentSubtype.Transplant: {
            const t = requireTransplantTarget(target);
            if (!t) return { success: false, error: GAME_ERRORS.NO_TARGET };
            return playTransplant(g, ps, cardIdx, t.a, t.b);
          }

          case TreatmentSubtype.OrganThief: {
            const t = requireSimpleTarget(target);
            if (!t) return { success: false, error: GAME_ERRORS.NO_TARGET };
            return playOrganThief(g, ps, cardIdx, t);
          }

          case TreatmentSubtype.Contagion: {
            if (!target || !Array.isArray(target)) {
              return { success: false, error: GAME_ERRORS.NO_TARGET };
            }
            return playContagion(g, ps, cardIdx, target);
          }

          case TreatmentSubtype.Gloves:
            return playGlove(g, ps, cardIdx);

          case TreatmentSubtype.MedicalError: {
            const t = requireSimpleTarget(target);
            if (!t) return { success: false, error: GAME_ERRORS.NO_TARGET };
            return playMedicalError(g, ps, cardIdx, t);
          }

          default:
            return { success: false, error: GAME_ERRORS.UNSUPPORTED_TREATMENT };
        }

      default:
        return { success: false, error: GAME_ERRORS.UNSUPPORTED_CARD };
    }
  };

const requireSimpleTarget = (target?: PlayCardTarget | TransplantTarget): PlayCardTarget | null => {
  if (!target || 'a' in target) return null;
  return target;
};

const requireTransplantTarget = (
  target?: PlayCardTarget | TransplantTarget
): TransplantTarget | null => {
  if (!target || !('a' in target)) return null;
  return target;
};
