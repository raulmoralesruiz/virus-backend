import { Player } from './Player.interface';

export interface Room {
  id: string;
  name: string;
  players: Player[];
}
