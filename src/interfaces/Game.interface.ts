// backend/src/interfaces/Game.interface.ts
import { Card } from './Card.interface.js';

export interface PlayerState {
  playerId: string;
  hand: Card[];
}

export interface PublicPlayerInfo {
  playerId: string;
  handCount: number; // no revelamos cartas
  organs?: any; // placeholder: estructura futura del “cuerpo” en mesa
}

export interface GameState {
  roomId: string;
  deck: Card[];
  discard: Card[];
  players: PlayerState[]; // mano privada en servidor
  public: {
    players: PublicPlayerInfo[]; // info pública (tamaños de mano, órganos en mesa)
  };
  startedAt: string; // ISO string
  // En el futuro: turno actual, fase, etc.
}
