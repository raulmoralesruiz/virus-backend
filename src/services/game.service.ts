import { randomUUID } from 'crypto';
import { Card, CardColor, CardKind, TreatmentSubtype } from '../interfaces/Card.interface.js';
import { GameState, PlayerState, PublicPlayerInfo } from '../interfaces/Game.interface.js';
import { getRooms } from './room.service.js'; // ya existente en tu backend
import { logger } from '../utils/logger.js';
import { Player } from '../interfaces/Player.interface.js';

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

const pushMany = (
  cards: Card[],
  kind: CardKind,
  color: CardColor,
  count: number,
  subtype?: TreatmentSubtype
) => {
  for (let i = 0; i < count; i++) {
    cards.push({ id: randomUUID(), kind, color, subtype });
  }
};

const buildDeck = (): Card[] => {
  const cards: Card[] = [];

  // Órganos
  pushMany(cards, CardKind.Organ, CardColor.Red, 5);
  pushMany(cards, CardKind.Organ, CardColor.Green, 5);
  pushMany(cards, CardKind.Organ, CardColor.Blue, 5);
  pushMany(cards, CardKind.Organ, CardColor.Yellow, 5);
  pushMany(cards, CardKind.Organ, CardColor.Multi, 1);

  // Virus
  pushMany(cards, CardKind.Virus, CardColor.Red, 4);
  pushMany(cards, CardKind.Virus, CardColor.Green, 4);
  pushMany(cards, CardKind.Virus, CardColor.Blue, 4);
  pushMany(cards, CardKind.Virus, CardColor.Yellow, 4);
  pushMany(cards, CardKind.Virus, CardColor.Multi, 1);

  // Medicinas
  pushMany(cards, CardKind.Medicine, CardColor.Red, 4);
  pushMany(cards, CardKind.Medicine, CardColor.Green, 4);
  pushMany(cards, CardKind.Medicine, CardColor.Blue, 4);
  pushMany(cards, CardKind.Medicine, CardColor.Yellow, 4);
  pushMany(cards, CardKind.Medicine, CardColor.Multi, 4);

  // Tratamientos
  pushMany(cards, CardKind.Treatment, CardColor.Multi, 2, TreatmentSubtype.Contagion);
  pushMany(cards, CardKind.Treatment, CardColor.Multi, 3, TreatmentSubtype.OrganThief);
  pushMany(cards, CardKind.Treatment, CardColor.Multi, 3, TreatmentSubtype.Transplant);
  pushMany(cards, CardKind.Treatment, CardColor.Multi, 1, TreatmentSubtype.Gloves);
  pushMany(cards, CardKind.Treatment, CardColor.Multi, 1, TreatmentSubtype.MedicalError);

  return shuffle(cards);
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

  const publicPlayers: PublicPlayerInfo[] = players.map(pl => {
    const ps = privateStates.find(p => p.player === pl)!;
    return {
      player: pl,
      handCount: ps.hand.length,
      board: [], // mesa vacía al inicio
    };
  });

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
