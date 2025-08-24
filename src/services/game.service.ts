import { Card } from '../interfaces/Card.interface.js';
import { GameState, PlayerState, PublicPlayerInfo } from '../interfaces/Game.interface.js';
import { logger } from '../utils/logger.js';
import { Player } from '../interfaces/Player.interface.js';
import { scheduleTurnTimer } from './turn-timer.service.js';
import { playCardInternal } from './card/card.service.js';
import { buildDeck } from './deck.service.js';
import { drawCardInternal } from './card/draw-card.service.js';
import { clearGameInternal, endTurnInternal, isPlayersTurnInternal } from './turn/turn.service.js';
import { getPlayerHandInternal, getPublicStateInternal } from './query/query.service.js';

// Estado en memoria: 1 partida por sala (roomId)
const games = new Map<string, GameState>();
const turnTimers = new Map<string, NodeJS.Timeout>();

// ⏱️ 60s por turno
export const TURN_DURATION_MS = 60_000;

// --- Gestión de partida ---
export const startGame = (roomId: string, players: Player[]): GameState => {
  logger.info(`game.service - startGame room=${roomId} players=${players.length}`);

  // si ya existe, la reiniciamos
  const deck = buildDeck();
  const discard: Card[] = [];

  // Repartir mano inicial: 3 cartas por jugador
  const privateStates: PlayerState[] = players.map(player => ({
    player: player,
    hand: deck.splice(0, 3), // 3 cartas iniciales
  }));

  const publicPlayers: PublicPlayerInfo[] = privateStates.map(ps => ({
    player: ps.player,
    handCount: ps.hand.length,
    board: [], // mesa vacía al inicio
  }));

  const now = Date.now();
  const game: GameState = {
    roomId,
    deck,
    discard,
    players: privateStates,
    public: { players: publicPlayers },
    startedAt: new Date().toISOString(),
    turnIndex: 0,
    turnStartedAt: now,
    turnDeadlineTs: now + TURN_DURATION_MS,
  };

  games.set(roomId, game);
  scheduleTurnTimer(roomId, games, turnTimers);
  return game;
};

export const getGame = (roomId: string): GameState | undefined => games.get(roomId);

// --- Consultas (query) ---
export const getPublicState = getPublicStateInternal(games);
export const getPlayerHand = getPlayerHandInternal(games);

// --- Acciones de juego ---
export const drawCard = drawCardInternal(games);
export const isPlayersTurn = isPlayersTurnInternal(games);
export const endTurn = endTurnInternal(games, turnTimers);
export const clearGame = clearGameInternal(games, turnTimers);
export const playCard = playCardInternal(games);
