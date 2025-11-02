import { Server, Socket } from 'socket.io';
import {
  createRoom,
  getPublicRooms,
  getRoomByKey,
  getRooms,
  joinRoom,
  leaveRoom,
} from '../services/room.service.js';
import { ROOM_CONSTANTS } from '../constants/room.constants.js';
import { logger } from '../utils/logger.js';
import { wsEmitter } from '../ws/emitter.js';
import { clearPlayerSocketId, setPlayerSocketId } from '../services/player.service.js';
import { GAME_CONSTANTS } from '../constants/game.constants.js';

const registerRoomEvents = (io: Server, socket: Socket) => {
  socket.on(ROOM_CONSTANTS.ROOM_NEW, ({ player, visibility }) => {
    logger.info(`${ROOM_CONSTANTS.ROOM_NEW} - Creating a new room...`);
    logger.info(`${ROOM_CONSTANTS.ROOM_NEW} - data player = ${JSON.stringify(player)}`);
    logger.info(`${ROOM_CONSTANTS.ROOM_NEW} - visibility = ${visibility}`);

    // Create a new room
    const sanitizedVisibility = visibility === 'private' ? 'private' : 'public';
    const room = createRoom(player, sanitizedVisibility);
    joinRoom(room.id, player);

    socket.data.playerId = player.id;
    setPlayerSocketId(player.id, socket.id);
    socket.join(room.id);

    wsEmitter.emitRoomsList();
    wsEmitter.emitRoomUpdated(room.id);
  });

  socket.on(ROOM_CONSTANTS.ROOM_JOIN, ({ roomId, player }) => {
    logger.info(`${ROOM_CONSTANTS.ROOM_JOIN} - Player ${player.name} joining ${roomId}`);

    const roomSnapshot = getRoomByKey(roomId);
    if (!roomSnapshot) {
      socket.emit('error', { message: 'Sala no encontrada' });
      return;
    }

    if (roomSnapshot.inProgress) {
      socket.emit('error', { message: 'La partida ya está en curso' });
      return;
    }

    const room = joinRoom(roomId, player);
    if (!room) {
      socket.emit('error', { message: 'No fue posible unir a la sala' });
      return;
    }

    socket.data.playerId = player.id;
    setPlayerSocketId(player.id, socket.id);
    socket.join(room.id);

    // Lista de salas para todos
    wsEmitter.emitRoomsList();
    wsEmitter.emitRoomUpdated(room.id);
  });

  socket.on(ROOM_CONSTANTS.ROOM_GET_ALL, () => {
    logger.info(`${ROOM_CONSTANTS.ROOM_GET_ALL} - Fetching all rooms...`);
    socket.emit(ROOM_CONSTANTS.ROOMS_LIST, getPublicRooms());
    logger.info(`${ROOM_CONSTANTS.ROOMS_LIST} - Sent list of rooms to client`);
  });

  socket.on(ROOM_CONSTANTS.ROOM_LEAVE, ({ roomId, playerId }) => {
    logger.info(`${ROOM_CONSTANTS.ROOM_LEAVE} - Player ${playerId} leaving ${roomId}`);

    if (!roomId || !playerId) {
      logger.warn(`${ROOM_CONSTANTS.ROOM_LEAVE} - roomId or playerId missing`);
      return;
    }

    const result = leaveRoom(roomId, playerId);

    clearPlayerSocketId(socket.id);
    socket.leave(roomId);

    wsEmitter.emitRoomsList();
    if (result.room) {
      wsEmitter.emitRoomUpdated(result.room.id);
    }

    // notificar a la sala que la partida terminó/ya no está disponible
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, null);
    io.to(roomId).emit(GAME_CONSTANTS.GAME_END, { roomId, winner: null });
  });

  // Additional room-related events can be registered here
};

export default registerRoomEvents;
