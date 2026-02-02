import { Card, CardKind } from '../interfaces/Card.interface.js';
import { GameState, PlayerState, PublicPlayerInfo } from '../interfaces/Game.interface.js';
import { logger } from '../utils/logger.js';
import { Player } from '../interfaces/Player.interface.js';
import { TURN_DURATION_MS } from '../constants/turn.constants.js';
import { scheduleTurnTimer } from './turn-timer.service.js';
import { playCardInternal } from './card/card.service.js';
import { buildDeck } from './deck.service.js';
import { drawCardInternal } from './card/draw-card.service.js';
import { clearGameInternal, endTurnInternal, isPlayersTurnInternal } from './turn/turn.service.js';
import { getPlayerHandInternal, getPublicStateInternal } from './query/query.service.js';
import { discardCardsInternal } from './card/discard-card.service.js';
import { pushHistoryEntry } from '../utils/history.utils.js';
import { setTrickOrTreatOwner } from '../utils/trick-or-treat.utils.js';
import { RoomConfig } from '../interfaces/Room.interface.js';


// Estado en memoria: 1 partida por sala (roomId)
const games = new Map<string, GameState>();
const turnTimers = new Map<string, NodeJS.Timeout>();

const TURN_TIMER_OPTIONS = new Set([30, 60, 90, 120]);
const computeTurnDurationMs = (config?: RoomConfig): number => {
  const timerSeconds = config?.timerSeconds;
  if (typeof timerSeconds === 'number' && TURN_TIMER_OPTIONS.has(timerSeconds)) {
    return timerSeconds * 1000;
  }
  return TURN_DURATION_MS;
};

// --- Gestión de partida ---
export const startGame = (roomId: string, players: Player[], config?: RoomConfig): GameState => {
  logger.info(`game.service - startGame room=${roomId} players=${players.length}`);

  // si ya existe, la reiniciamos
  const includeHalloweenExpansion = config?.mode === 'halloween';
  const deck = buildDeck({ includeHalloweenExpansion });
  const discard: Card[] = [];
  const turnDurationMs = computeTurnDurationMs(config);

  // Repartir mano inicial: 3 cartas por jugador
  const privateStates: PlayerState[] = players.map(player => ({
    player: player,
    hand: deck.splice(0, 3), // 3 cartas iniciales
    hasTrickOrTreat: false,
  }));

  const publicPlayers: PublicPlayerInfo[] = privateStates.map(ps => ({
    player: ps.player,
    handCount: ps.hand.length,
    board: [], // mesa vacía al inicio
    hasTrickOrTreat: false,
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
    turnDeadlineTs: now + turnDurationMs,
    turnDurationMs,
    history: [],
    lastActionAt: now,
  };

  games.set(roomId, game);
  scheduleTurnTimer(roomId, games, turnTimers, endTurn);
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

const _playCard = playCardInternal(games);
export const playCard = (...args: Parameters<typeof _playCard>) => {
  const result = _playCard(...args);
  if (result.success) {
    const g = games.get(args[0]);
    if (g) g.lastActionAt = Date.now();
  }
  return result;
};

const _discardCards = discardCardsInternal(games, endTurn);
export const discardCards = (...args: Parameters<typeof _discardCards>) => {
  const result = _discardCards(...args);
  if (result.success) {
    const g = games.get(args[0]);
    if (g) g.lastActionAt = Date.now();
  }
  return result;
};

export const removePlayerFromGame = (
  roomId: string,
  playerId: string
): {
  game: GameState | null;
  removed: boolean;
  forcedEnd?: {
    lastPlayerId: string;
    lastPlayerName: string;
    lastPlayerSocketId?: string;
  };
} => {
  const game = games.get(roomId);
  if (!game) {
    return { game: null, removed: false };
  }

  const originalTurnIndex = game.turnIndex;
  const privateIdx = game.players.findIndex(p => p.player.id === playerId);
  const publicIdx = game.public.players.findIndex(p => p.player.id === playerId);

  if (privateIdx === -1 && publicIdx === -1) {
    return { game, removed: false };
  }

  const removedCards: Card[] = [];
  let removedPlayerName: string | undefined;
  const wasCurrentPlayer = privateIdx === originalTurnIndex;
  const removedHadTrickOrTreat = game.public.players.some(
    p => p.player.id === playerId && p.hasTrickOrTreat
  );

  if (privateIdx !== -1) {
    const [removedPrivate] = game.players.splice(privateIdx, 1);
    if (removedPrivate) {
      removedCards.push(...removedPrivate.hand);
      removedPlayerName = removedPrivate.player.name;
    }
  }

  if (publicIdx !== -1) {
    const [removedPublic] = game.public.players.splice(publicIdx, 1);
    if (removedPublic) {
      removedPlayerName = removedPlayerName ?? removedPublic.player.name;
      for (const organ of removedPublic.board) {
        removedCards.push({
          id: organ.id,
          kind: CardKind.Organ,
          color: organ.color,
        });
        removedCards.push(...organ.attached);
      }
    }
  }

  if (removedCards.length) {
    game.discard.push(...removedCards);
  }

  if (removedHadTrickOrTreat) {
    setTrickOrTreatOwner(game, null);
    pushHistoryEntry(
      game,
      `Truco o Trato desaparece tras la salida de ${removedPlayerName ?? 'un jugador'}`
    );
  }

  if (removedPlayerName) {
    pushHistoryEntry(game, `${removedPlayerName} abandonó la partida`);
  }

  if (game.players.length === 0) {
    clearGame(roomId);
    return { game: null, removed: true };
  }

  if (game.players.length === 1) {
    const survivor = game.players[0];
    const forcedEndInfo = {
      lastPlayerId: survivor.player.id,
      lastPlayerName: survivor.player.name,
      lastPlayerSocketId: survivor.player.socketId,
    };
    clearGame(roomId);
    return { game: null, removed: true, forcedEnd: forcedEndInfo };
  }

  if (privateIdx !== -1 && privateIdx < originalTurnIndex) {
    game.turnIndex = Math.max(0, originalTurnIndex - 1);
  } else if (game.turnIndex >= game.players.length) {
    game.turnIndex = 0;
  }

  if (wasCurrentPlayer) {
    const now = Date.now();
    game.turnStartedAt = now;
    const duration = game.turnDurationMs ?? TURN_DURATION_MS;
    game.turnDeadlineTs = now + duration;
    scheduleTurnTimer(roomId, games, turnTimers, endTurn);
  }

  return { game, removed: true };
};
