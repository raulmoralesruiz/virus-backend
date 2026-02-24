import { GameState, HistoryEntry } from '../interfaces/Game.interface.js';

export const HISTORY_LIMIT = 999;

export const pushHistoryEntry = (
  game: GameState | null | undefined,
  entry: HistoryEntry | string | null | undefined
) => {
  if (!game || !entry) return;

  const historyObj: HistoryEntry = typeof entry === 'string' ? { plainText: entry } : entry;

  game.history.unshift(historyObj);
  if (game.history.length > HISTORY_LIMIT) {
    game.history.splice(HISTORY_LIMIT);
  }
};
