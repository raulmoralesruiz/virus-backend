import { getIO } from './io.js';
import { getRooms } from '../services/room.service.js';
import { ROOM_CONSTANTS } from '../constants/room.constants.js';
import { logger } from '../utils/logger.js';

export const wsEmitter = {
  emitRoomsList: () => {
    const io = getIO();
    io.emit(ROOM_CONSTANTS.ROOMS_LIST, getRooms());
    logger.info(`${ROOM_CONSTANTS.ROOMS_LIST} - Emitted list of rooms to all clients`);
  },
  emitRoomUpdated: (roomId: string) => {
    const room = getRooms().find(r => r.id === roomId);
    if (room) {
      getIO().to(roomId).emit(ROOM_CONSTANTS.ROOM_JOINED, room);
      logger.info(`${ROOM_CONSTANTS.ROOM_JOINED} - Emitted updated room info to room ${roomId}`);
    }
  },
};
