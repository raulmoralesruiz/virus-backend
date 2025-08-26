import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { GameState, PlayerState, PlayCardResult } from '../../../interfaces/Game.interface.js';

export const playMedicalError = (
  g: GameState,
  ps: PlayerState,
  cardIdx: number,
  target: { playerId: string }
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!target?.playerId) return { success: false, error: GAME_ERRORS.NO_TARGET };

  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  const pubOther = g.public.players.find(pp => pp.player.id === target.playerId);
  if (!pubSelf || !pubOther) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

  const tmp = [...pubSelf.board];
  pubSelf.board = [...pubOther.board];
  pubOther.board = tmp;

  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  return { success: true };
};
