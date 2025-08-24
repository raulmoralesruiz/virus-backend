import { GameState } from '../interfaces/Game.interface.js';

// Estado en memoria: 1 partida por sala (roomId)
const games = new Map<string, GameState>();

export const getGame = (roomId: string): GameState | undefined => {
  return games.get(roomId);
};

export const setGame = (roomId: string, game: GameState): void => {
  games.set(roomId, game);
};

export const deleteGame = (roomId: string): void => {
  games.delete(roomId);
};

export const hasGame = (roomId: string): boolean => {
  return games.has(roomId);
};

export const isPlayersTurn = (roomId: string, playerId: string): boolean => {
  const g = games.get(roomId);
  if (!g) return false;
  return g.players[g.turnIndex]?.player.id === playerId;
};

// Exportamos games en caso de necesitar iterar en otros servicios
export { games };
