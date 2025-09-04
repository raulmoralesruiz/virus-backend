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

  const targetPub = g.public.players.find(pp => pp.player.id === target.playerId);
  const myPub = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (!targetPub || !myPub) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

  // Swap completo de cuerpo
  const temp = [...myPub.board];
  myPub.board = [...targetPub.board];
  targetPub.board = temp;

  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (pubSelf) pubSelf.handCount = ps.hand.length;

  return { success: true };
};
