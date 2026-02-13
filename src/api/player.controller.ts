import { Router } from 'express';
import { createPlayer, getPlayerById, updatePlayerName } from '../services/player.service.js';

const router = Router();

// Crear jugador
router.post('/', (req, res) => {
  const { name } = req.body as { name: string };
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const player = createPlayer(name.trim());
  return res.json(player);
});

// Actualizar nombre jugador
router.put('/:id', (req, res) => {
  const { name } = req.body as { name: string };
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const player = updatePlayerName(req.params.id, name.trim());
  if (!player) return res.status(404).json({ error: 'Player not found' });
  return res.json(player);
});

// Obtener jugador por id
router.get('/:id', (req, res) => {
  const player = getPlayerById(req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  return res.json(player);
});

export default router;
