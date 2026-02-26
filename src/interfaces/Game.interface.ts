import { Card, CardColor, CardKind } from './Card.interface.js';
import { Player } from './Player.interface.js';

export interface PlayerState {
  player: Player;
  hand: Card[];
  skipNextTurn?: boolean;
  hasTrickOrTreat?: boolean;
}

export interface HistoryEntry {
  plainText?: string;
  player?: string;
  action?: string;
  cardName?: string;
  cardColor?: string;
  target?: string;
}

export interface PublicPlayerInfo {
  player: Player;
  board: OrganOnBoard[]; // cartas visibles en mesa
  handCount: number; // solo el número de cartas en mano, no cuáles son
  hasTrickOrTreat?: boolean;
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
  turnDurationMs?: number;
  winner?: PublicPlayerInfo; // 🏆 jugador ganador si ya terminó
  history: HistoryEntry[]; // historial detallado de acciones
  pendingAction?: ApparitionDecision;
  lastActionAt: number; // timestamp for inactivity check (last play/discard/draw)
}

export interface PublicGameState {
  roomId: string;
  startedAt: string;
  discardCount: number;
  topDiscard?: Card; // última carta descartada visible
  deckCount: number;
  players: PublicPlayerInfo[];
  turnIndex: number;
  turnDeadlineTs: number;
  remainingSeconds: number;
  winner?: PublicPlayerInfo;
  history: HistoryEntry[];
  pendingAction?: ApparitionDecision;
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

export interface TransplantTarget {
  a: PlayCardTarget;
  b: PlayCardTarget;
}

export interface PlayCardResultOk {
  success: true;
}
export interface PlayCardResultErr {
  success: false;
  error: { code: string; message: string };
}
export type PlayCardResult = PlayCardResultOk | PlayCardResultErr;

export interface DrawCardResultOk {
  success: true;
  card: Card;
}

export interface DrawCardResultErr {
  success: false;
  error: { code: string; message: string };
}

export type DrawCardResult = DrawCardResultOk | DrawCardResultErr;

export interface OrganOnBoard {
  id: string;
  kind: CardKind.Organ;
  color: CardColor;
  attached: Card[]; // virus o medicinas colocadas encima
}

export interface ContagionTarget {
  fromOrganId: string; // órgano infectado propio
  toPlayerId: string; // jugador destino
  toOrganId: string; // órgano destino
}

export interface MedicalErrorTarget {
  playerId: string;
}

export interface FailedExperimentTarget extends PlayCardTarget {
  action: 'medicine' | 'virus';
}

export interface BodySwapTarget {
  direction: 'clockwise' | 'counter-clockwise';
}

export interface ApparitionDecision {
  type: 'ApparitionDecision';
  playerId: string;
  cardId: string;
}

export type AnyPlayTarget =
  | PlayCardTarget
  | TransplantTarget
  | MedicalErrorTarget
  | ContagionTarget[]
  | FailedExperimentTarget
  | BodySwapTarget;
