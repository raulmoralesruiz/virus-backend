import { Server, Socket } from 'socket.io';
import { createPlayer, getPlayerById } from '../services/player.service';

const registerPlayerEvents = (io: Server, socket: Socket) => {
  // Create a new player
  socket.on('player:create', (name: string) => {
    const player = createPlayer(name);
    socket.emit('player:created', player);
  });

  // get player by ID
  socket.on('player:getById', (id: string) => {
    const player = getPlayerById(id);
    if (player) {
      socket.emit('player:found', player);
    } else {
      socket.emit('player:notFound', { id });
    }
  });

  // // Placeholder for player-related events
  // socket.on('player:action', (action: any) => {
  //   console.log(`Jugador ${socket.id} realizó una acción:`, action);

  //   // Handle player action
  //   io.emit('player:actionResponse', { playerId: socket.id, action });
  // });
};

export default registerPlayerEvents;
