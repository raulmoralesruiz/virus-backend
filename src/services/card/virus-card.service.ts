import { CardColor, CardKind } from '../../interfaces/Card.interface.js';
import { PlayCardResult, PlayCardTarget, GameState } from '../../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../../constants/error.constants.js';

export const playVirusCard = (
  g: GameState,
  ps: GameState['players'][0],
  cardIdx: number,
  target?: PlayCardTarget
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!target?.playerId || !target?.organId)
    return { success: false, error: GAME_ERRORS.NO_TARGET };

  const targetPub = g.public.players.find(pp => pp.player.id === target.playerId);
  if (!targetPub) return { success: false, error: GAME_ERRORS.INVALID_TARGET };

  const organ = targetPub.board.find(c => c.id === target.organId && c.kind === CardKind.Organ);
  if (!organ) return { success: false, error: GAME_ERRORS.NO_ORGAN };

  const colorOk =
    card.color === CardColor.Multi || organ.color === CardColor.Multi || card.color === organ.color;

  if (!colorOk) return { success: false, error: GAME_ERRORS.COLOR_MISMATCH };

  // efecto: destruir órgano
  targetPub.board = targetPub.board.filter(c => c.id !== organ.id);
  g.discard.push(organ);

  ps.hand.splice(cardIdx, 1);
  g.discard.push(card);

  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (pubSelf) pubSelf.handCount = ps.hand.length;

  return { success: true };
};
