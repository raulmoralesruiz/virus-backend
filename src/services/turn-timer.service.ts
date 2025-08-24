import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { GameState } from '../interfaces/Game.interface.js';
import { logger } from '../utils/logger.js';
import { getIO } from '../ws/io.js';
import { TURN_DURATION_MS } from './game.service.js';

// --- Timer interno por sala ---
export const scheduleTurnTimer = (
  roomId: string,
  games: Map<string, GameState>,
  turnTimers: Map<string, NodeJS.Timeout>
) => {
  const old = turnTimers.get(roomId);
  if (old) clearTimeout(old);

  const g = games.get(roomId);
  if (!g) return;

  const msLeft = Math.max(0, g.turnDeadlineTs - Date.now());
  const to = setTimeout(() => {
    logger.info(`[turn-timer] auto end-turn room=${roomId}`);
    g.turnIndex = (g.turnIndex + 1) % g.players.length;
    const now = Date.now();
    g.turnStartedAt = now;
    g.turnDeadlineTs = now + TURN_DURATION_MS;

    const io = getIO();
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, {
      roomId: g.roomId,
      startedAt: g.startedAt,
      discardCount: g.discard.length,
      deckCount: g.deck.length,
      players: g.public.players,
      turnIndex: g.turnIndex,
      turnDeadlineTs: g.turnDeadlineTs,
    });
  }, msLeft);

  turnTimers.set(roomId, to);
};
