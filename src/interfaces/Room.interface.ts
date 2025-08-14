import { Player } from './Player.interface.js';

export interface Room {
  id: string;
  name: string;
  players: Player[];
}
