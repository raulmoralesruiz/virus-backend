import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardColor, CardKind, Card, TreatmentSubtype } from '../../interfaces/Card.interface.js';
import {
  PlayCardResult,
  PlayCardTarget,
  GameState,
  TransplantTarget,
  AnyPlayTarget,
  FailedExperimentTarget,
} from '../../interfaces/Game.interface.js';

import { playOrganCard } from './organ-card.service.js';
import { playMedicineCard } from './medicine-card.service.js';
import { playVirusCard } from './virus-card.service.js';
import { playTransplant } from './treatment/transplant.service.js';
import { playOrganThief } from './treatment/organ-thief.service.js';
import { playContagion } from './treatment/contagion.service.js';
import { playGlove } from './treatment/glove.service.js';
import { playMedicalError } from './treatment/medical-error.service.js';
import { playTrickOrTreat } from './treatment/trick-or-treat.service.js';
import { endTurn } from '../game.service.js';
import { drawCardInternal } from './draw-card.service.js';
import { checkVictory } from '../../utils/victory-utils.js';
import { playFailedExperiment } from './treatment/failed-experiment.service.js';
import { playColorThief } from './treatment/color-thief.service.js';
import { playBodySwap } from './treatment/body-swap.service.js';

export const playCardInternal =
  (games: Map<string, GameState>) =>
  (
    roomId: string,
    playerId: string,
    cardId: string,
    target?: AnyPlayTarget
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
            const t = requirePlayerTarget(target);
            res = t
              ? playMedicalError(g, ps, cardIdx, t)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          case TreatmentSubtype.trickOrTreat: {
            const t = requirePlayerTarget(target);
            res = t
              ? playTrickOrTreat(g, ps, cardIdx, t)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          case TreatmentSubtype.failedExperiment: {
            const t = requireFailedExperimentTarget(target);
            res = t
              ? playFailedExperiment(g, ps, cardIdx, t)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

        break;

          case TreatmentSubtype.ColorThiefRed: {
            const t = requireSimpleTarget(target);
            res = t
              ? playColorThief(g, ps, cardIdx, t, CardColor.Red)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          case TreatmentSubtype.ColorThiefGreen: {
            const t = requireSimpleTarget(target);
            res = t
              ? playColorThief(g, ps, cardIdx, t, CardColor.Green)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          case TreatmentSubtype.ColorThiefBlue: {
            const t = requireSimpleTarget(target);
            res = t
              ? playColorThief(g, ps, cardIdx, t, CardColor.Blue)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          case TreatmentSubtype.ColorThiefYellow: {
            const t = requireSimpleTarget(target);
            res = t
              ? playColorThief(g, ps, cardIdx, t, CardColor.Yellow)
              : { success: false, error: GAME_ERRORS.NO_TARGET };
            break;
          }

          case TreatmentSubtype.BodySwap: {
            const t = requireBodySwapTarget(target);
            res = t
              ? playBodySwap(g, ps, cardIdx, t)
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

    // 3️⃣ Si jugada válida → comprobar victoria, robar y finalizar turno
    if (res.success) {
      const winner = checkVictory(g);
      if (winner) {
        g.winner = winner;

        // no robamos ni avanzamos turno → la partida terminó
        return res;
      }

      // si no hay ganador → sigue flujo normal
      const draw = drawCardInternal(games);
      draw(roomId, playerId); // roba automáticamente 1 carta
      endTurn(roomId);
    }

    return res;
  };

const requireSimpleTarget = (target?: AnyPlayTarget): PlayCardTarget | null => {
  if (!target || Array.isArray(target) || 'a' in (target as any)) return null;
  if (!('organId' in (target as any)) || !(target as any).organId) return null;
  if (!('playerId' in (target as any)) || !(target as any).playerId) return null;
  return target as PlayCardTarget;
};

const requireTransplantTarget = (target?: AnyPlayTarget): TransplantTarget | null => {
  if (!target || Array.isArray(target) || !('a' in (target as any))) return null;
  return target as TransplantTarget;
};

const requirePlayerTarget = (target?: AnyPlayTarget): { playerId: string } | null => {
  if (!target || Array.isArray(target) || 'a' in (target as any)) return null;
  if (!('playerId' in (target as any)) || !(target as any).playerId) return null;
  return { playerId: (target as any).playerId };
};

const requireFailedExperimentTarget = (target?: AnyPlayTarget): FailedExperimentTarget | null => {
  if (!target || Array.isArray(target) || 'a' in (target as any)) return null;
  if (!('organId' in (target as any)) || !(target as any).organId) return null;
  if (!('playerId' in (target as any)) || !(target as any).playerId) return null;
  if (!('action' in (target as any)) || !(target as any).action) return null;
  return target as FailedExperimentTarget;
};

const requireBodySwapTarget = (target?: AnyPlayTarget): { direction: 'clockwise' | 'counter-clockwise' } | null => {
  if (!target || Array.isArray(target)) return null;
  if (!('direction' in (target as any))) return null;
  const d = (target as any).direction;
  if (d !== 'clockwise' && d !== 'counter-clockwise') return null;
  return { direction: d };
};
