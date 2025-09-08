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
import { endTurn } from '../game.service.js';
import { drawCardInternal } from './draw-card.service.js';

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

    // 1️⃣ Verificar turno
    if (g.players[g.turnIndex].player.id !== playerId) {
      return { success: false, error: GAME_ERRORS.NOT_YOUR_TURN };
    }

    const cardIdx = ps.hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return { success: false, error: GAME_ERRORS.NO_CARD };

    const card = ps.hand[cardIdx];

    // 2️⃣ Resolver jugada con los servicios existentes
    let res: PlayCardResult = { success: false, error: GAME_ERRORS.UNSUPPORTED_CARD };

    switch (card.kind) {
      case CardKind.Organ:
        res = playOrganCard(g, ps, cardIdx);
        break;

      case CardKind.Virus: {
        const t = requireSimpleTarget(target);
        res = t
          ? playVirusCard(g, ps, cardIdx, t)
          : { success: false, error: GAME_ERRORS.NO_TARGET };
        break;
      }

      case CardKind.Medicine: {
        const t = requireSimpleTarget(target);
        res = t
          ? playMedicineCard(g, ps, cardIdx, t)
          : { success: false, error: GAME_ERRORS.NO_TARGET };
        break;
      }

      case CardKind.Treatment:
        switch (card.subtype) {
          case TreatmentSubtype.Transplant: {
            const t = requireTransplantTarget(target);
            res = t
              ? playTransplant(g, ps, cardIdx, t.a, t.b)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          case TreatmentSubtype.OrganThief: {
            const t = requireSimpleTarget(target);
            res = t
              ? playOrganThief(g, ps, cardIdx, t)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          case TreatmentSubtype.Contagion:
            res = Array.isArray(target)
              ? playContagion(g, ps, cardIdx, target)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;

          case TreatmentSubtype.Gloves:
            res = playGlove(g, ps, cardIdx);
            break;

          case TreatmentSubtype.MedicalError: {
            const t = requireSimpleTarget(target);
            res = t
              ? playMedicalError(g, ps, cardIdx, t)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          default:
            res = { success: false, error: GAME_ERRORS.UNSUPPORTED_TREATMENT };
            break;
        }
        break;

      default:
        res = { success: false, error: GAME_ERRORS.UNSUPPORTED_CARD };
        break;
    }

    // 3️⃣ Si jugada válida → robar carta y finalizar turno
    if (res.success) {
      const draw = drawCardInternal(games);
      draw(roomId, playerId); // roba automáticamente 1 carta
      endTurn(roomId);
    }

    return res;
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
