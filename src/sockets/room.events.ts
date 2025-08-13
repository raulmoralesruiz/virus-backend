import { Server, Socket } from 'socket.io';
import { createRoom, getRooms, joinRoom } from '../services/room.service';
import { ROOM_CONSTANTS } from '../constants/room.constants';
import { logger } from '../utils/logger';

const registerRoomEvents = (io: Server, socket: Socket) => {
  socket.on(ROOM_CONSTANTS.ROOM_NEW, ({ player }) => {
    logger.info(`${ROOM_CONSTANTS.ROOM_NEW} - Creating a new room...`);

    // Create a new room
    const room = createRoom();
    joinRoom(room.id, player);

    io.emit(ROOM_CONSTANTS.ROOMS_LIST, getRooms());
    socket.emit(ROOM_CONSTANTS.ROOM_CREATED, room);
    socket.emit(ROOM_CONSTANTS.ROOM_JOINED, room);

    logger.info(`${ROOM_CONSTANTS.ROOM_CREATED} - Room created with ID: ${room.id}`);
    logger.info(`${ROOM_CONSTANTS.ROOM_JOINED} - Player ${player.name} joined room ${room.id}`);
  });

  socket.on(ROOM_CONSTANTS.ROOM_JOIN, ({ roomId, player }) => {
    logger.info(
      `${ROOM_CONSTANTS.ROOM_JOIN} - Player ${player.name} is trying to join room ${roomId}`
    );

    const room = joinRoom(roomId, player);
    // socket.join(roomId);
    io.emit(ROOM_CONSTANTS.ROOMS_LIST, getRooms());
    socket.emit(ROOM_CONSTANTS.ROOM_JOINED, room);

    logger.info(`${ROOM_CONSTANTS.ROOM_JOIN} - Player ${player.name} joined room ${roomId}`);
    logger.info(`${ROOM_CONSTANTS.ROOM_JOINED} - Room joined successfully: ${roomId}`);
  });

  socket.on(ROOM_CONSTANTS.ROOM_GET_ALL, () => {
    logger.info(`${ROOM_CONSTANTS.ROOM_GET_ALL} - Fetching all rooms...`);

    const rooms = getRooms();
    socket.emit(ROOM_CONSTANTS.ROOMS_LIST, rooms);
    logger.info(`${ROOM_CONSTANTS.ROOMS_LIST} - Sent list of rooms to client`);
  });

  // Additional room-related events can be registered here
};

export default registerRoomEvents;
