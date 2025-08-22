import { Card } from '../interfaces/Card.interface.js';
import { GameState, PlayerState, PublicPlayerInfo } from '../interfaces/Game.interface.js';
import { logger } from '../utils/logger.js';
import { Player } from '../interfaces/Player.interface.js';
import {
  BASE_DECK_CONFIG,
  DeckEntry,
  EXPANSION_HALLOWEEN_DECK_CONFIG,
} from '../config/deck.config.js';

// Estado en memoria: 1 partida por sala (roomId)
const games = new Map<string, GameState>();

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

  const game: GameState = {
    roomId,
    deck,
    discard,
    players: privateStates,
    public: { players: publicPlayers },
    startedAt: new Date().toISOString(),
  };

  games.set(roomId, game);
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
