import { randomUUID } from 'crypto';
import { Room } from '../interfaces/Room.interface.js';
import { logger } from '../utils/logger.js';
import { Player } from '../interfaces/Player.interface.js';
import { GameState } from '../interfaces/Game.interface.js';
import { getPlayerById } from './player.service.js';
import { clearGame, removePlayerFromGame } from './game.service.js';

const rooms: Room[] = [];

export const generateRoomId = () => randomUUID();

export const generateRoomName = (roomId: string) => {
  return `${roomId.slice(0, 6)}`;
};

type RoomVisibility = Room['visibility'];

export const createRoom = (player: Player, visibility: RoomVisibility = 'public') => {
  logger.info('room.service - Creating a new room...');

  const roomId = generateRoomId();
  const roomName = generateRoomName(roomId);

  const room: Room = {
    id: roomId,
    name: roomName,
    hostId: player.id,
    players: [],
    inProgress: false,
    visibility,
  };
  logger.info(
    `room.service - New room created with ID: ${roomId}, Name: ${roomName} and visibility: ${visibility}`
  );

  rooms.push(room);
  return room;
};

const findRoomByKey = (roomKey: string): Room | null => {
  if (!roomKey) return null;
  return rooms.find(r => r.id === roomKey || r.name === roomKey) ?? null;
};

export const joinRoom = (roomKey: string, player: Player) => {
  logger.info(`room.service - Player ${player.name} is joining room ${roomKey}`);

  const room = findRoomByKey(roomKey);
  if (!room || !player) return null;

  if (room.inProgress) {
    logger.info(`room.service - Room ${room.id} is already in progress. Join rejected.`);
    return null;
  }

  // Usamos siempre la versión "real" del player (con socketId actualizado si existe)
  const fullPlayer = getPlayerById(player.id) ?? player;

  const already = room.players.some(p => p.id === player.id);
  if (!already) room.players.push(fullPlayer);

  return room;
};

export const setRoomInProgress = (roomId: string, inProgress: boolean) => {
  const room = rooms.find(r => r.id === roomId);
  if (!room) return null;
  room.inProgress = inProgress;
  return room;
};

// get rooms
export const getRooms = () => {
  logger.info('room.service - Fetching all rooms...');
  return rooms;
};

export const getPublicRooms = () => {
  logger.info('room.service - Fetching all PUBLIC rooms...');
  return rooms.filter(r => r.visibility === 'public');
};

export const getRoomById = (roomId: string): Room | null => {
  logger.info(`room.service - getRoomById ${roomId}`);
  return rooms.find(r => r.id === roomId) ?? null;
};

export const getRoomByKey = (roomKey: string): Room | null => {
  logger.info(`room.service - getRoomByKey ${roomKey}`);
  return findRoomByKey(roomKey);
};

export const removeRoom = (roomId: string) => {
  const idx = rooms.findIndex(r => r.id === roomId);
  if (idx !== -1) {
    rooms.splice(idx, 1);
    clearGame(roomId); // limpia partida y timer
  }
};

export const leaveRoom = (
  roomId: string,
  playerId: string
): { room: Room | null; removed: boolean; game: GameState | null; gamePlayerRemoved: boolean } => {
  logger.info(`room.service - Player ${playerId} leaving room ${roomId}`);

  const room = rooms.find(r => r.id === roomId);
  if (!room) {
    return { room: null, removed: false, game: null, gamePlayerRemoved: false };
  }

  const idx = room.players.findIndex(p => p.id === playerId);
  if (idx === -1) {
    const gameInfo = removePlayerFromGame(roomId, playerId);
    if (!gameInfo.game) {
      setRoomInProgress(roomId, false);
    }
    return { room, removed: false, game: gameInfo.game, gamePlayerRemoved: gameInfo.removed };
  }

  room.players.splice(idx, 1);

  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
    logger.info(`room.service - Reassigned host to ${room.hostId}`);
  }

  const gameInfo = removePlayerFromGame(roomId, playerId);
  if (!gameInfo.game) {
    setRoomInProgress(roomId, false);
  }

  if (room.players.length === 0) {
    removeRoom(roomId);
    return { room: null, removed: true, game: null, gamePlayerRemoved: gameInfo.removed };
  }

  return { room, removed: false, game: gameInfo.game, gamePlayerRemoved: gameInfo.removed };
};

// util para tests/manual
export const _roomsStore = () => rooms;
