import { Router } from 'express';
import { getRooms, createRoom, joinRoom, getRoomById } from '../services/room.service.js';
import { getPlayerById } from '../services/player.service.js';
import { wsEmitter } from '../ws/emitter.js';

const router = Router();

// Lista inicial de salas
router.get('/', (_req, res) => {
  return res.json(getRooms());
});

// Obtener sala por id
router.get('/:id', (req, res) => {
  const room = getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  return res.json(room);
});

// Crear sala y unir al creador
router.post('/', (req, res) => {
  const { playerId } = req.body as { playerId: string };
  if (!playerId) return res.status(400).json({ error: 'playerId is required' });

  const player = getPlayerById(playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const room = createRoom();
  const joined = joinRoom(room.id, player.id);
  if (!joined) return res.status(404).json({ error: 'Room creation/join failed' });

  // Notificar a todos los clientes por WS
  wsEmitter.emitRoomsList();
  wsEmitter.emitRoomUpdated(room.id);

  return res.json(joined);
});

// Unirse a sala existente
router.post('/join/:roomId', (req, res) => {
  const { playerId } = req.body as { playerId: string };
  const { roomId } = req.params;

  if (!playerId) return res.status(400).json({ error: 'playerId is required' });
  const player = getPlayerById(playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const room = joinRoom(roomId, player.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  wsEmitter.emitRoomsList();
  wsEmitter.emitRoomUpdated(room.id);

  return res.json(room);
});

export default router;
