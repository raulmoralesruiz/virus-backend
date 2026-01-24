import { GameState, PlayerState } from '../../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../../constants/error.constants.js';
import { PlayCardResult, PlayCardTarget } from '../../interfaces/Game.interface.js';
import { OrganOnBoard } from '../../interfaces/Game.interface.js';
import { CardKind, CardColor } from '../../interfaces/Card.interface.js';

export const playOrganCard = (
  g: GameState,
  // ps: GameState['players'][0],
  ps: PlayerState,
  cardIdx: number,
  target?: PlayCardTarget | null
): PlayCardResult => {
  const card = ps.hand[cardIdx];
  const pubSelf = g.public.players.find(pp => pp.player.id === ps.player.id);
  if (!pubSelf) return { success: false, error: GAME_ERRORS.PUBLIC_MISSING };

  const isMutant = card.color === CardColor.Orange;

  if (isMutant) {
    if (!target) {
        // Asegurar que existe un objetivo
        return { success: false, error: GAME_ERRORS.INVALID_TARGET };
    }
  }

  if (isMutant && target) {
    // Lógica de reemplazo
    if (target.playerId !== ps.player.id) {
        return { success: false, error: GAME_ERRORS.INVALID_TARGET };
    }

    const organIdx = pubSelf.board.findIndex(o => o.id === target.organId);
    if (organIdx === -1) {
        return { success: false, error: GAME_ERRORS.INVALID_TARGET };
    }

    // Descartar órgano existente y sus cartas
    const removedOrgan = pubSelf.board[organIdx];
    g.discard.push({
        id: removedOrgan.id,
        kind: CardKind.Organ,
        color: removedOrgan.color
    });
    g.discard.push(...removedOrgan.attached);

    // Eliminar de board
    pubSelf.board.splice(organIdx, 1);
  }

  // Buscamos si ya hay un órgano de este color en la mesa
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
