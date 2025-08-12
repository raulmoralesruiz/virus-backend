import { randomUUID } from 'crypto';
import { Socket } from 'socket.io';
import { Player } from '../interfaces/Player.interface';
import { Room } from '../interfaces/Room.interface';
import { getPlayerById } from './player.service';

const rooms: Room[] = [];

export const generateRoomId = () => {
  return randomUUID();
};

export const generateRoomName = (roomId: string) => {
  return `Sala-${roomId.slice(0, 6)}`;
};

export const createRoom = () => {
  const roomId = generateRoomId();
  const roomName = generateRoomName(roomId);

  const room: Room = {
    id: roomId,
    name: roomName,
    players: [],
  };

  rooms.push(room);
  return room;
};

export const joinRoom = (roomId: string, playerId: string) => {
  const room = rooms.find(r => r.id === roomId);
  const player = getPlayerById(playerId);
  if (room && player) {
    room.players.push(player);
    return room; // Return the updated room
  }
  return null; // Room not found
};

// get rooms
export const getRooms = () => {
  return rooms;
};
