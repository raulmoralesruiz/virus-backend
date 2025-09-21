import { randomUUID } from 'crypto';
import { Room } from '../interfaces/Room.interface.js';
import { logger } from '../utils/logger.js';
import { Player } from '../interfaces/Player.interface.js';
import { getPlayerById } from './player.service.js';
import { clearGame } from './game.service.js';

const rooms: Room[] = [];

export const generateRoomId = () => randomUUID();

export const generateRoomName = (roomId: string) => {
  return `${roomId.slice(0, 6)}`;
};

export const createRoom = (player: Player) => {
  logger.info('room.service - Creating a new room...');

  const roomId = generateRoomId();
  const roomName = generateRoomName(roomId);

  const room: Room = {
    id: roomId,
    name: roomName,
    hostId: player.id,
    players: [],
  };
  logger.info(`room.service - New room created with ID: ${roomId} and Name: ${roomName}`);

  rooms.push(room);
  return room;
};

export const joinRoom = (roomId: string, player: Player) => {
  logger.info(`room.service - Player ${player.name} is joining room ${roomId}`);

  const room = rooms.find(r => r.id === roomId);
  if (!room || !player) return null;

  // Usamos siempre la versión "real" del player (con socketId actualizado si existe)
  const fullPlayer = getPlayerById(player.id) ?? player;

  const already = room.players.some(p => p.id === player.id);
  if (!already) room.players.push(fullPlayer);

  return room;
};

// get rooms
export const getRooms = () => {
  logger.info('room.service - Fetching all rooms...');
  return rooms;
};

export const getRoomById = (roomId: string): Room | null => {
  logger.info(`room.service - getRoomById ${roomId}`);
  return rooms.find(r => r.id === roomId) ?? null;
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
): { room: Room | null; removed: boolean } => {
  logger.info(`room.service - Player ${playerId} leaving room ${roomId}`);

  const room = rooms.find(r => r.id === roomId);
  if (!room) {
    return { room: null, removed: false };
  }

  const idx = room.players.findIndex(p => p.id === playerId);
  if (idx === -1) {
    return { room, removed: false };
  }

  room.players.splice(idx, 1);

  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
    logger.info(`room.service - Reassigned host to ${room.hostId}`);
  }

  if (room.players.length === 0) {
    removeRoom(roomId);
    return { room: null, removed: true };
  }

  clearGame(roomId);
  return { room, removed: false };
};

// util para tests/manual
export const _roomsStore = () => rooms;
