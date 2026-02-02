import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { GameState, PlayerState, PlayCardResult } from '../../../interfaces/Game.interface.js';
import { pushHistoryEntry } from '../../../utils/history.utils.js';
import { setTrickOrTreatOwner } from '../../../utils/trick-or-treat.utils.js';

export const playTrickOrTreat = (
  g: GameState,
  ps: PlayerState,
  cardIdx: number,
  target: { playerId: string }
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  if (!card) {
    return { success: false, error: GAME_ERRORS.NO_CARD };
  }

  if (!target?.playerId) {
    return { success: false, error: GAME_ERRORS.NO_TARGET };
  }

  if (target.playerId === ps.player.id) {
    return { success: false, error: GAME_ERRORS.INVALID_TARGET };
  }

  const targetPrivate = g.players.find(p => p.player.id === target.playerId);
  const targetPublic = g.public.players.find(p => p.player.id === target.playerId);

  if (!targetPrivate || !targetPublic) {
    return { success: false, error: GAME_ERRORS.INVALID_TARGET };
  }

  ps.hand.splice(cardIdx, 1);

  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (pubSelf) pubSelf.handCount = ps.hand.length;

  setTrickOrTreatOwner(g, targetPrivate.player.id);
  pushHistoryEntry(g, `Truco o Trato recae sobre ${targetPublic.player.name}`);

  return { success: true };
};
