import { randomUUID } from 'crypto';
import { Player } from '../interfaces/Player.interface.js';
import { logger } from '../utils/logger.js';
import { getRooms } from './room.service.js';

const players: Player[] = [];

export const generatePlayerId = () => {
  return randomUUID();
};

// CRUD operations for players
/**
 * Creates a new player with a unique ID and the provided name.
 * @param name - The name of the player.
 * @returns The created player object.
 */
export const createPlayer = (name: string): Player => {
  logger.info(`player.service - Creating player with name: ${name}`);

  const player: Player = {
    id: generatePlayerId(),
    name,
  };

  players.push(player);
  return player;
};

/**
 * Retrieves all players.
 * @returns An array of all player objects.
 */
export const getAllPlayers = (): Player[] => {
  return players;
};

/**
 * Retrieves a player by their ID.
 * @param id - The ID of the player to retrieve.
 * @returns The player object if found, otherwise null.
 */
export const getPlayerById = (id: string): Player | null => {
  return players.find(player => player.id === id) ?? null;
};

export const removePlayer = (id: string): void => {
  const index = players.findIndex(player => player.id === id);
  if (index !== -1) {
    players.splice(index, 1);
  }
};

export const setPlayerSocketId = (playerId: string, socketId: string) => {
  let player = getPlayerById(playerId);

  if (!player) {
    // intentar recuperarlo desde alguna sala
    const roomWithPlayer = getRooms().find(r => r.players.some(pl => pl.id === playerId));
    const roomPlayer = roomWithPlayer?.players.find(pl => pl.id === playerId);
    if (roomPlayer) {
      player = roomPlayer;
      players.push(roomPlayer);
    } else {
      player = { id: playerId, name: `Jugador`, socketId };
      players.push(player);
    }
  }

  player.socketId = socketId;
  logger.info(`[player.service] set socket ${socketId} for player ${playerId}`);

  const room = getRooms().find(r => r.players.some(pl => pl.id === playerId));
  if (room) {
    const pl = room.players.find(pl => pl.id === playerId);
    if (pl) pl.socketId = socketId;
  }

  return player;
};

export const clearPlayerSocketId = (socketId: string) => {
  const p = players.find(pl => pl.socketId === socketId);
  if (p) p.socketId = undefined;
};

// util para tests/manual
export const _playersStore = () => players;
