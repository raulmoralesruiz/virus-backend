import { Card, CardColor, CardKind } from './Card.interface.js';
import { Player } from './Player.interface.js';

export interface PlayerState {
  player: Player;
  hand: Card[];
}

export interface PublicPlayerInfo {
  player: Player;
  board: OrganOnBoard[]; // cartas visibles en mesa
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
  turnIndex: number; // índice del jugador activo en `players`
  turnStartedAt: number; // epoch ms
  turnDeadlineTs: number; // epoch ms (turnStartedAt + TURN_DURATION_MS)
}

export interface PlayerHandPayload {
  roomId: string;
  playerId: string;
  hand: Card[];
}

export interface PlayCardTarget {
  playerId: string;
  organId: string;
}

export interface PlayCardResultOk {
  success: true;
}
export interface PlayCardResultErr {
  success: false;
  error: { code: string; message: string };
}
export type PlayCardResult = PlayCardResultOk | PlayCardResultErr;

export interface OrganOnBoard {
  id: string;
  kind: CardKind.Organ;
  color: CardColor;
  attached: Card[]; // virus o medicinas colocadas encima
}
