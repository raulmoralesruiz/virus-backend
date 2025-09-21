import { GAME_ERRORS } from '../../constants/error.constants.js';
import { GameState, PlayCardResult } from '../../interfaces/Game.interface.js';
import { drawCardInternal, HAND_LIMIT } from './draw-card.service.js';

export const discardCardsInternal =
  (games: Map<string, GameState>, onEndTurn?: (roomId: string) => void) =>
  (roomId: string, playerId: string, cardIds: string[]): PlayCardResult => {
    const g = games.get(roomId);
    if (!g) return { success: false, error: GAME_ERRORS.NO_GAME };

    const ps = g.players.find(p => p.player.id === playerId);
    if (!ps) return { success: false, error: GAME_ERRORS.NO_PLAYER };

    // verificar turno
    if (g.players[g.turnIndex].player.id !== playerId) {
      return { success: false, error: GAME_ERRORS.NOT_YOUR_TURN };
    }

    if (!cardIds || cardIds.length === 0 || cardIds.length > 3) {
      return { success: false, error: GAME_ERRORS.INVALID_TARGET }; // descartes inválidos
    }

    // verificar que las cartas están en mano
    for (const cid of cardIds) {
      if (!ps.hand.some(c => c.id === cid)) {
        return { success: false, error: GAME_ERRORS.NO_CARD };
      }
    }

    // mover cartas al descarte
    for (const cid of cardIds) {
      const idx = ps.hand.findIndex(c => c.id === cid);
      if (idx !== -1) {
        const [removed] = ps.hand.splice(idx, 1);
        g.discard.push(removed);
      }
    }

    // robar hasta volver al límite de cartas
    const draw = drawCardInternal(games);
    while (ps.hand.length < HAND_LIMIT) {
      const res = draw(roomId, playerId);
      if (!res.success) break; // si no hay cartas, se corta
    }

    // finalizar turno
    onEndTurn?.(roomId);
    return { success: true };
  };
