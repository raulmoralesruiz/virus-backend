import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind } from '../../../interfaces/Card.interface.js';
import {
  GameState,
  PlayCardResult,
  PlayCardTarget,
  PlayerState,
} from '../../../interfaces/Game.interface.js';

export const playAlienTransplant = (
  g: GameState,
  ps: PlayerState,
  cardIdx: number,
  targetA: PlayCardTarget,
  targetB: PlayCardTarget
): PlayCardResult => {
  const card = ps.hand[cardIdx];

  if (!targetA?.playerId || !targetA.organId || !targetB?.playerId || !targetB.organId) {
    return { success: false, error: GAME_ERRORS.NO_TARGET };
  }

  const pubA = g.public.players.find(pp => pp.player.id === targetA.playerId);
  const pubB = g.public.players.find(pp => pp.player.id === targetB.playerId);
  if (!pubA || !pubB) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

  const organA = pubA.board.find(c => c.id === targetA.organId && c.kind === CardKind.Organ);
  const organB = pubB.board.find(c => c.id === targetB.organId && c.kind === CardKind.Organ);
  if (!organA || !organB) return { success: false, error: GAME_ERRORS.NO_ORGAN };

  // DIFFERENCE WITH TRANSPLANT: No check for isImmune(organA) || isImmune(organB)

  // evitar duplicados de color
  if (pubA.board.some(o => o.id !== organA.id && o.color === organB.color)) {
    return { success: false, error: GAME_ERRORS.DUPLICATE_ORGAN };
  }
  if (pubB.board.some(o => o.id !== organB.id && o.color === organA.color)) {
    return { success: false, error: GAME_ERRORS.DUPLICATE_ORGAN };
  }

  // swap
  pubA.board = pubA.board.map(o => (o.id === organA.id ? organB : o));
  pubB.board = pubB.board.map(o => (o.id === organB.id ? organA : o));

  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
