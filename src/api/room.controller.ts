import { Router } from 'express';
import { getRoomById, getPublicRooms } from '../services/room.service.js';

const router = Router();

// Lista inicial de salas
router.get('/', (_req, res) => {
  return res.json(getPublicRooms());
});

// Obtener sala por id
router.get('/:id', (req, res) => {
  const room = getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  return res.json(room);
});

export default router;
