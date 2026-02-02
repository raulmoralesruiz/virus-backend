import { Player } from './Player.interface.js';

export type RoomGameMode = 'base' | 'halloween';
export type RoomTimerSeconds = 30 | 60 | 90 | 120;

export interface RoomConfig {
  mode: RoomGameMode;
  timerSeconds: RoomTimerSeconds;
}

export interface Room {
  id: string;
  name: string;
  hostId: string; // id del jugador creador
  players: Player[];
  inProgress: boolean;
  visibility: 'public' | 'private';
  config: RoomConfig;
}
