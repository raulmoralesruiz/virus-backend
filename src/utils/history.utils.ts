import { GameState } from '../interfaces/Game.interface.js';

export const HISTORY_LIMIT = 999;

export const pushHistoryEntry = (
  game: GameState | null | undefined,
  entry: string | null | undefined
) => {
  if (!game || !entry) return;

  game.history.unshift(entry);
  if (game.history.length > HISTORY_LIMIT) {
    game.history.splice(HISTORY_LIMIT);
  }
};
