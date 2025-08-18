import { randomUUID } from 'crypto';
import { Card, CardColor, CardKind } from '../interfaces/Card.interface.js';
import { GameState, PlayerState, PublicPlayerInfo } from '../interfaces/Game.interface.js';
import { getRooms } from './room.service.js'; // ya existente en tu backend
import { logger } from '../utils/logger.js';

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

// TODO: ajustar composición exacta de Virus! (68 cartas) en sprint siguiente.
// Por ahora, un mazo mínimo suficiente para repartir (prueba).
const buildDeck = (): Card[] => {
  const cards: Card[] = [];

  const pushMany = (kind: CardKind, color: CardColor, count: number) => {
    for (let i = 0; i < count; i++) {
      cards.push({ id: randomUUID(), kind, color });
    }
  };

  // Órganos (placeholder de cantidades)
  pushMany(CardKind.Organ, CardColor.Red, 4);
  pushMany(CardKind.Organ, CardColor.Green, 4);
  pushMany(CardKind.Organ, CardColor.Blue, 4);
  pushMany(CardKind.Organ, CardColor.Yellow, 4);
  pushMany(CardKind.Organ, CardColor.Multi, 1); // multicolor

  // Virus
  pushMany(CardKind.Virus, CardColor.Red, 4);
  pushMany(CardKind.Virus, CardColor.Green, 4);
  pushMany(CardKind.Virus, CardColor.Blue, 4);
  pushMany(CardKind.Virus, CardColor.Yellow, 4);
  pushMany(CardKind.Virus, CardColor.Multi, 1);

  // Medicinas
  pushMany(CardKind.Medicine, CardColor.Red, 4);
  pushMany(CardKind.Medicine, CardColor.Green, 4);
  pushMany(CardKind.Medicine, CardColor.Blue, 4);
  pushMany(CardKind.Medicine, CardColor.Yellow, 4);
  pushMany(CardKind.Medicine, CardColor.Multi, 1);

  // Tratamientos (se añadirán con detalle en sprint siguiente)
  // p.ej. pushMany(CardKind.Treatment, CardColor.Multi, X);

  return shuffle(cards);
};

// Crea/inicia partida en una sala (si no existe)
export const startGame = (roomId: string, playerIds: string[]): GameState => {
  logger.info(`game.service - startGame room=${roomId} players=${playerIds.length}`);

  // si ya existe, la reiniciamos (o podrías abortar)
  const deck = buildDeck();
  const discard: Card[] = [];

  // Repartir mano inicial: 3 cartas por jugador
  const players: PlayerState[] = playerIds.map(pid => ({
    playerId: pid,
    hand: deck.splice(0, 3), // 3 cartas, como dice el reglamento
  }));

  const publicPlayers: PublicPlayerInfo[] = players.map(p => ({
    playerId: p.playerId,
    handCount: p.hand.length,
    organs: {}, // por implementar en sprint de mesa
  }));

  const game: GameState = {
    roomId,
    deck,
    discard,
    players,
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
    players: g.public.players,
  };
};

export const getPlayerHand = (roomId: string, playerId: string): Card[] | null => {
  const g = games.get(roomId);
  if (!g) return null;
  const ps = g.players.find(p => p.playerId === playerId);
  return ps ? ps.hand : null;
};
