import { randomUUID } from 'crypto';
import { Room } from '../interfaces/Room.interface.js';
import { getPlayerById } from './player.service.js';
import { logger } from '../utils/logger.js';
import { Player } from '../interfaces/Player.interface.js';

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

  const already = room.players.some(p => p.id === player.id);
  if (!already) room.players.push(player);

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

// util para tests/manual
export const _roomsStore = () => rooms;
