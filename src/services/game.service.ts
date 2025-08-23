import { Card } from '../interfaces/Card.interface.js';
import { GameState, PlayerState, PublicPlayerInfo } from '../interfaces/Game.interface.js';
import { logger } from '../utils/logger.js';
import { Player } from '../interfaces/Player.interface.js';
import {
  BASE_DECK_CONFIG,
  DeckEntry,
  EXPANSION_HALLOWEEN_DECK_CONFIG,
} from '../config/deck.config.js';
import { getIO } from '../ws/io.js';
import { GAME_CONSTANTS } from '../constants/game.constants.js';

// Estado en memoria: 1 partida por sala (roomId)
const games = new Map<string, GameState>();

// ⏱️ 60s por turno
export const TURN_DURATION_MS = 60_000;
const turnTimers = new Map<string, NodeJS.Timeout>();

// --- Utilidades ---
const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// reciclar descarte si no hay cartas en mazo
const maybeRecycleDiscard = (g: GameState) => {
  if (g.deck.length === 0 && g.discard.length > 0) {
    // Mezclamos descarte en el mazo
    g.deck = shuffle(g.discard);
    g.discard = [];
  }
};

/**
 * Genera un mazo a partir de una lista de definiciones de cartas.
 * IDs deterministas: kind_color_subtype_index
 */
const buildDeckFromConfig = (config: DeckEntry[]): Card[] => {
  const cards: Card[] = [];

  for (const entry of config) {
    for (let i = 1; i <= entry.count; i++) {
      const subtypePart = entry.subtype ? `_${entry.subtype}` : '';
      const id = `${entry.kind}_${entry.color}${subtypePart}_${i}`;

      cards.push({
        id,
        kind: entry.kind,
        color: entry.color,
        subtype: entry.subtype,
      });
    }
  }

  return cards;
};

/**
 * Mazo final = base + expansiones (si se quieren activar).
 */
export const buildDeck = (): Card[] => {
  const base = buildDeckFromConfig(BASE_DECK_CONFIG);
  const halloween = buildDeckFromConfig(EXPANSION_HALLOWEEN_DECK_CONFIG);
  return shuffle([...base, ...halloween]);
};

// Crea/inicia partida en una sala (si no existe)
export const startGame = (roomId: string, players: Player[]): GameState => {
  logger.info(`game.service - startGame room=${roomId} players=${players.length}`);

  // si ya existe, la reiniciamos (o podrías abortar)
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
  scheduleTurnTimer(roomId);
  return game;
};

export const getGame = (roomId: string): GameState | undefined => games.get(roomId);

export const getPublicState = (roomId: string) => {
  const g = games.get(roomId);
  if (!g) return null;
  return {
    roomId: g.roomId,
    startedAt: g.startedAt,
    discardCount: g.discard.length,
    deckCount: g.deck.length,
    players: g.public.players, // incluye Player, board y handCount
    turnIndex: g.turnIndex,
    turnDeadlineTs: g.turnDeadlineTs,
  };
};

export const getPlayerHand = (roomId: string, playerId: string): Card[] | null => {
  const g = games.get(roomId);
  if (!g) return null;
  const ps = g.players.find(p => p.player.id === playerId);
  return ps ? ps.hand : null;
};

// robar 1 carta
export const drawCard = (roomId: string, playerId: string): Card | null => {
  const g = games.get(roomId);
  if (!g) return null;

  // intenta reciclar descarte si fuera necesario
  maybeRecycleDiscard(g);

  if (g.deck.length === 0) return null;

  const ps = g.players.find(p => p.player.id === playerId);
  if (!ps) return null;

  const card = g.deck.shift()!; // roba 1
  ps.hand.push(card);

  // actualizar público (handCount del jugador)
  const pub = g.public.players.find(pp => pp.player.id === playerId);
  if (pub) pub.handCount = ps.hand.length;

  return card;
};

// Validación de turno
export const isPlayersTurn = (roomId: string, playerId: string): boolean => {
  const g = games.get(roomId);
  if (!g) return false;
  return g.players[g.turnIndex]?.player.id === playerId;
};

// Avanza turno
export const endTurn = (roomId: string): GameState | null => {
  const g = games.get(roomId);
  if (!g) return null;
  g.turnIndex = (g.turnIndex + 1) % g.players.length;
  const now = Date.now();
  g.turnStartedAt = now;
  g.turnDeadlineTs = now + TURN_DURATION_MS;

  // reiniciar timer
  scheduleTurnTimer(roomId);
  return g;
};

// --- Timer interno por sala ---
const scheduleTurnTimer = (roomId: string) => {
  const old = turnTimers.get(roomId);
  if (old) clearTimeout(old);

  const g = games.get(roomId);
  if (!g) return;

  const msLeft = Math.max(0, g.turnDeadlineTs - Date.now());
  const to = setTimeout(() => {
    logger.info(`[turn-timer] auto end-turn room=${roomId}`);
    endTurn(roomId);
    // broadcast nuevo estado
    const io = getIO();
    io.to(roomId).emit(GAME_CONSTANTS.GAME_STATE, getPublicState(roomId));
  }, msLeft);

  turnTimers.set(roomId, to);
};

export const clearGame = (roomId: string) => {
  const timer = turnTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    turnTimers.delete(roomId);
  }
  games.delete(roomId);
};
