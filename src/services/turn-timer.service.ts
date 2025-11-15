import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { GameState } from '../interfaces/Game.interface.js';
import { logger } from '../utils/logger.js';
import { getIO } from '../ws/io.js';
import { discardCardsInternal } from './card/discard-card.service.js';
import { getRooms } from './room.service.js';

// --- Timer interno por sala ---
export const scheduleTurnTimer = (
  roomId: string,
  games: Map<string, GameState>,
  turnTimers: Map<string, NodeJS.Timeout>,
  endTurn?: (roomId: string) => void
) => {
  const old = turnTimers.get(roomId);
  if (old) {
    clearInterval(old);
    turnTimers.delete(roomId);
  }

  const g = games.get(roomId);
  if (!g) return;

  const io = getIO();

  const emitState = (game: GameState) => {
    const msLeft = Math.max(0, game.turnDeadlineTs - Date.now());
    const remainingSeconds = Math.max(0, Math.ceil(msLeft / 1000));

    io.to(roomId).volatile.emit(GAME_CONSTANTS.GAME_STATE, {
      roomId: game.roomId,
      startedAt: game.startedAt,
      discardCount: game.discard.length,
      deckCount: game.deck.length,
      players: game.public.players,
      turnIndex: game.turnIndex,
      turnDeadlineTs: game.turnDeadlineTs,
      remainingSeconds,
      winner: (game as any).winner ?? null,
      history: game.history,
    });
  };

  // emitir inmediatamente para sincronizar clientes justo ahora
  emitState(g);

  // intervalo por segundo: actualiza estado y detecta expiración
  const interval = setInterval(() => {
    const game = games.get(roomId);
    if (!game) {
      clearInterval(interval);
      turnTimers.delete(roomId);
      return;
    }

    const msLeft = game.turnDeadlineTs - Date.now();

    if (msLeft <= 0) {
      logger.info(
        `[turn-timer] timeout room=${roomId} player=${game.players[game.turnIndex].player.id}`
      );

      // 1) Forzar descarte aleatorio de la mano del jugador activo (si tiene cartas)
      const currentPlayer = game.players[game.turnIndex];
      if (currentPlayer && currentPlayer.hand.length > 0) {
        const randIdx = Math.floor(Math.random() * currentPlayer.hand.length);
        const randomCardId = currentPlayer.hand[randIdx].id;

        // 👉 usar servicio centralizado
        const discard = discardCardsInternal(games, endTurn);
        discard(roomId, currentPlayer.player.id, [randomCardId]);

        // 2) Emitir la mano privada actualizada SOLO a ese jugador
        const room = getRooms().find(r => r.id === roomId);
        if (room) {
          const pl = room.players.find(p => p.id === currentPlayer.player.id);
          if (pl?.socketId) {
            const privateState = game.players.find(p => p.player.id === pl.id);
            const hand = privateState ? [...privateState.hand] : [];
            const payload = { roomId, playerId: pl.id, hand };
            io.to(pl.socketId).emit(GAME_CONSTANTS.GAME_HAND, payload);
          }
        }
      }

      // 3) Emitir estado actualizado para toda la sala
      emitState(game);
      return;
    }

    // si no ha expirado, emitir estado con remainingSeconds actualizado
    emitState(game);
  }, 1000);

  turnTimers.set(roomId, interval as unknown as NodeJS.Timeout);
};
