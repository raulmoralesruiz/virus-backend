import { Player } from './Player.interface.js';

export interface Room {
  id: string;
  name: string;
  hostId: string; // id del jugador creador
  players: Player[];
  inProgress: boolean;
  visibility: 'public' | 'private';
}
