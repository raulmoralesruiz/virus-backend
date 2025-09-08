import { GameState, PlayerState } from '../../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../../constants/error.constants.js';
import { PlayCardResult } from '../../interfaces/Game.interface.js';
import { OrganOnBoard } from '../../interfaces/Game.interface.js';
import { CardKind } from '../../interfaces/Card.interface.js';

export const playOrganCard = (
  g: GameState,
  // ps: GameState['players'][0],
  ps: PlayerState,
  cardIdx: number
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (!pubSelf) return { success: false, error: GAME_ERRORS.PUBLIC_MISSING };

  const already = pubSelf.board.some(c => c.kind === card.kind && c.color === card.color);
  if (already) return { success: false, error: GAME_ERRORS.DUPLICATE_ORGAN };

  const organ: OrganOnBoard = {
    id: card.id,
    kind: CardKind.Organ,
    color: card.color,
    attached: [],
  };

  ps.hand.splice(cardIdx, 1);
  pubSelf.board.push(organ);
  pubSelf.handCount = ps.hand.length;

  return { success: true };
};
