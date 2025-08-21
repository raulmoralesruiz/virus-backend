import { Server, Socket } from 'socket.io';
import { createRoom, getRooms, joinRoom } from '../services/room.service.js';
import { ROOM_CONSTANTS } from '../constants/room.constants.js';
import { logger } from '../utils/logger.js';
import { wsEmitter } from '../ws/emitter.js';
import { setPlayerSocketId } from '../services/player.service.js';

const registerRoomEvents = (io: Server, socket: Socket) => {
  socket.on(ROOM_CONSTANTS.ROOM_NEW, ({ player }) => {
    logger.info(`${ROOM_CONSTANTS.ROOM_NEW} - Creating a new room...`);
    logger.info(`${ROOM_CONSTANTS.ROOM_NEW} - data player = ${JSON.stringify(player)}`);

    // Create a new room
    const room = createRoom(player);
    joinRoom(room.id, player);

    socket.data.playerId = player.id;
    setPlayerSocketId(player.id, socket.id);
    socket.join(room.id);

    wsEmitter.emitRoomsList();
    wsEmitter.emitRoomUpdated(room.id);
  });

  socket.on(ROOM_CONSTANTS.ROOM_JOIN, ({ roomId, player }) => {
    logger.info(`${ROOM_CONSTANTS.ROOM_JOIN} - Player ${player.name} joining ${roomId}`);

    const room = joinRoom(roomId, player);
    if (!room) {
      socket.emit('error', { message: 'Sala no encontrada' });
      return;
    }

    socket.data.playerId = player.id;
    setPlayerSocketId(player.id, socket.id);
    socket.join(roomId);

    // Lista de salas para todos
    wsEmitter.emitRoomsList();
    wsEmitter.emitRoomUpdated(room.id);
  });

  socket.on(ROOM_CONSTANTS.ROOM_GET_ALL, () => {
    logger.info(`${ROOM_CONSTANTS.ROOM_GET_ALL} - Fetching all rooms...`);
    socket.emit(ROOM_CONSTANTS.ROOMS_LIST, getRooms());
    logger.info(`${ROOM_CONSTANTS.ROOMS_LIST} - Sent list of rooms to client`);
  });

  // Additional room-related events can be registered here
};

export default registerRoomEvents;
