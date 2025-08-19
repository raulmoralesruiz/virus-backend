import { Card } from './Card.interface.js';
import { Player } from './Player.interface.js';

export interface PlayerState {
  player: Player;
  hand: Card[];
}

export interface PublicPlayerInfo {
  player: Player;
  board: Card[]; // cartas visibles en mesa
  handCount: number; // solo el número de cartas en mano, no cuáles son
}

export interface GameState {
  roomId: string;
  deck: Card[];
  discard: Card[];
  players: PlayerState[]; // estado privado del servidor (mano real)
  public: {
    players: PublicPlayerInfo[]; // lo que ven todos
  };
  startedAt: string; // ISO string
  // futuro: turno actual, fase, etc.
}
