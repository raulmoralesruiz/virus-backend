import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor } from '../../../interfaces/Card.interface.js';
import {
  GameState,
  PlayerState,
  PlayCardTarget,
  PlayCardResult,
} from '../../../interfaces/Game.interface.js';

export const playColorThief = (
  g: GameState,
  ps: PlayerState,
  cardIdx: number,
  target: PlayCardTarget,
  targetColor: CardColor
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!target?.playerId || !target.organId) return { success: false, error: GAME_ERRORS.NO_TARGET };

  const targetPub = g.public.players.find(pp => pp.player.id === target.playerId);
  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (!targetPub || !pubSelf) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

  const organ = targetPub.board.find(c => c.id === target.organId && c.kind === CardKind.Organ);
  if (!organ) return { success: false, error: GAME_ERRORS.NO_ORGAN };

  // El órgano debe coincidir con el color objetivo de la carta
  if (organ.color !== targetColor) {
    return { success: false, error: GAME_ERRORS.COLOR_MISMATCH };
  }

  // NO comprobamos inmunidad (isImmune). El ladrón de colores puede robar todo.

  // Restricción: No puedes tener dos órganos del mismo color
  if (pubSelf.board.some(o => o.color === organ.color)) {
    return { success: false, error: GAME_ERRORS.DUPLICATE_ORGAN };
  }

  // Ejecutar robo: quitar al objetivo, dar al jugador
  targetPub.board = targetPub.board.filter(o => o.id !== organ.id);
  pubSelf.board.push(organ);

  // Descartar carta jugada
  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
