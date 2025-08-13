import { randomUUID } from 'crypto';
import { Room } from '../interfaces/Room.interface';
import { getPlayerById } from './player.service';
import { logger } from '../utils/logger';

const rooms: Room[] = [];

export const generateRoomId = () => {
  return randomUUID();
};

export const generateRoomName = (roomId: string) => {
  return `Sala-${roomId.slice(0, 6)}`;
};

export const createRoom = () => {
  logger.info('room.service - Creating a new room...');

  const roomId = generateRoomId();
  const roomName = generateRoomName(roomId);

  const room: Room = {
    id: roomId,
    name: roomName,
    players: [],
  };
  logger.info(`room.service - New room created with ID: ${roomId} and Name: ${roomName}`);

  rooms.push(room);
  return room;
};

export const joinRoom = (roomId: string, playerId: string) => {
  logger.info(`room.service - Player ${playerId} is joining room ${roomId}`);

  const room = rooms.find(r => r.id === roomId);
  const player = getPlayerById(playerId);
  if (room && player) {
    room.players.push(player);
    logger.info(`room.service - Player ${player.name} joined room ${roomId}`);
    return room; // Return the updated room
  }
  return null; // Room not found
};

// get rooms
export const getRooms = () => {
  logger.info('room.service - Fetching all rooms...');
  return rooms;
};
