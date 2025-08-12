import { Server, Socket } from 'socket.io';
import { createRoom, getRooms, joinRoom } from '../services/room.service';

const registerRoomEvents = (io: Server, socket: Socket) => {
  // socket.on('room:create', (playerName: string, callback: (roomId: string) => void) => {
  //   const roomId = socket.id; // Using socket ID as room ID for simplicity
  //   const newPlayer = createRoom(socket, roomId, playerName);
  //   callback(roomId);
  //   io.to(roomId).emit('roomData', { id: roomId, players: [newPlayer] });
  // });

  socket.on('room:create', () => {
    // Create a new room
    const room = createRoom();

    // Join the room after creation
    socket.join(room.id);

    // Notify all clients in the room
    io.to(room.id).emit('room:created', room);
  });

  socket.on('room:join', ({ roomId, player }) => {
    const room = joinRoom(roomId, player);
    socket.join(roomId);
    io.to(roomId).emit('room:joined', room);
  });

  socket.on('room:getAll', () => {
    const rooms = getRooms();
    socket.emit('rooms:list', rooms);
  });

  // Additional room-related events can be registered here
};

export default registerRoomEvents;
