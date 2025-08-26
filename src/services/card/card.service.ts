import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardColor, CardKind, Card, TreatmentSubtype } from '../../interfaces/Card.interface.js';
import { PlayCardResult, PlayCardTarget, GameState } from '../../interfaces/Game.interface.js';
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
  (roomId: string, playerId: string, cardId: string, target?: PlayCardTarget): PlayCardResult => {
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

      case CardKind.Virus:
        return playVirusCard(g, ps, cardIdx, target);

      case CardKind.Medicine:
        return playMedicineCard(g, ps, cardIdx, target);

      case CardKind.Treatment:
        switch (card.subtype) {
          // case TreatmentSubtype.Transplant:
          //   return playTransplant(g, ps, cardIdx, target, target);

          // case TreatmentSubtype.OrganThief:
          //   return playOrganThief(g, ps, cardIdx, target);

          case TreatmentSubtype.Contagion:
            return playContagion(g, ps, cardIdx);

          case TreatmentSubtype.Gloves:
            return playGlove(g, ps, cardIdx);

          // case TreatmentSubtype.MedicalError:
          //   return playMedicalError(g, ps, cardIdx, target)

          default:
            return { success: false, error: GAME_ERRORS.UNSUPPORTED_TREATMENT };
        }

      default:
        return { success: false, error: GAME_ERRORS.UNSUPPORTED_CARD };
    }
  };
