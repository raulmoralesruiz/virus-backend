import { getIO } from './io.js';
import { getRooms } from '../services/room.service.js';
import { ROOM_CONSTANTS } from '../constants/room.constants.js';

export const wsEmitter = {
  emitRoomsList: () => {
    const io = getIO();
    io.emit(ROOM_CONSTANTS.ROOMS_LIST, getRooms());
  },
};
