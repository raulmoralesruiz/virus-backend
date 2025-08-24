import { GameState } from '../../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../../constants/error.constants.js';
import { PlayCardResult } from '../../interfaces/Game.interface.js';

export const playOrganCard = (
  g: GameState,
  ps: GameState['players'][0],
  cardIdx: number
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (!pubSelf) return { success: false, error: GAME_ERRORS.PUBLIC_MISSING };

  const already = pubSelf.board.some(c => c.kind === card.kind && c.color === card.color);
  if (already) return { success: false, error: GAME_ERRORS.DUPLICATE_ORGAN };

  ps.hand.splice(cardIdx, 1);
  pubSelf.board.push(card);
  pubSelf.handCount = ps.hand.length;

  return { success: true };
};
