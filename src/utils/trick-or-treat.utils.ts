import { GameState } from '../interfaces/Game.interface.js';

export const getTrickOrTreatOwnerId = (g: GameState): string | null => {
  const owner = g.players.find(p => p.hasTrickOrTreat);
  return owner?.player.id ?? null;
};

export const setTrickOrTreatOwner = (g: GameState, playerId: string | null) => {
  for (const ps of g.players) {
    ps.hasTrickOrTreat = playerId === ps.player.id;
  }

  for (const pub of g.public.players) {
    pub.hasTrickOrTreat = playerId === pub.player.id;
  }
};
