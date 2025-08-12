import { randomUUID } from 'crypto';
import { Player } from '../interfaces/Player.interface';

const players: Player[] = [];

export const generatePlayerId = () => {
  return randomUUID();
};

export const createPlayer = (name: string): Player => {
  const player: Player = {
    id: generatePlayerId(),
    name,
  };

  players.push(player);
  return player;
};

export const getPlayerById = (id: string): Player | undefined => {
  return players.find(player => player.id === id);
};

export const removePlayer = (id: string): void => {
  const index = players.findIndex(player => player.id === id);
  if (index !== -1) {
    players.splice(index, 1);
  }
};

export const getAllPlayers = (): Player[] => {
  return players;
};
