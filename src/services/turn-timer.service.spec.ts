import { CardColor, CardKind } from '../interfaces/Card.interface.js';
import { GameState } from '../interfaces/Game.interface.js';
import { TIMER_PAUSE_MAX_MS } from '../constants/turn.constants.js';

// --- Mocks de dependencias externas (io, rooms, descarte) ---
jest.mock('../ws/io.js', () => ({
  __esModule: true,
  getIO: jest.fn(),
}));

jest.mock('./room.service.js', () => ({
  __esModule: true,
  getRooms: jest.fn(() => []),
}));

jest.mock('./card/discard-card.service.js', () => ({
  __esModule: true,
  discardCardsInternal: jest.fn(),
}));

import { getIO } from '../ws/io.js';
import { discardCardsInternal } from './card/discard-card.service.js';
import { scheduleTurnTimer } from './turn-timer.service.js';

const NOW = 1_000_000_000; // timestamp base fijo

const mockEmit = jest.fn();
(getIO as jest.Mock).mockReturnValue({
  to: jest.fn().mockReturnValue({ volatile: { emit: mockEmit } }),
});

const createCard = (id: string) => ({
  id,
  kind: CardKind.Organ as const,
  color: CardColor.Red as const,
});

const createGame = (overrides: Partial<GameState> = {}): GameState => {
  const player = { id: 'p1', name: 'Alice' };
  const game: GameState = {
    roomId: 'room-timer',
    deck: [],
    discard: [],
    players: [
      { player, hand: [createCard('c1'), createCard('c2')] },
    ],
    public: {
      players: [{ player, handCount: 2, board: [] }],
    },
    startedAt: new Date(NOW).toISOString(),
    turnIndex: 0,
    turnStartedAt: NOW,
    turnDeadlineTs: NOW + 60_000,
    history: [],
    lastActionAt: NOW,
    ...overrides,
  };
  return game;
};

const lastEmittedState = (): any =>
  mockEmit.mock.calls[mockEmit.mock.calls.length - 1][1];

describe('scheduleTurnTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(NOW));
    mockEmit.mockClear();
    (discardCardsInternal as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('pausa el timer mientras hay pendingAction: el deadline se compensa cada tick', () => {
    const game = createGame({
      turnDeadlineTs: NOW + 5_000,
      pendingAction: { type: 'ApparitionDecision', playerId: 'p1', cardId: 'c9' },
    });
    const games = new Map([[game.roomId, game]]);
    const turnTimers = new Map<string, NodeJS.Timeout>();

    scheduleTurnTimer(game.roomId, games, turnTimers, jest.fn());

    const deadlineAtStart = game.turnDeadlineTs;
    jest.advanceTimersByTime(3_000); // 3 ticks

    // El deadline ha avanzado 3 ticks (1000 ms cada uno): el tiempo no "pasó"
    expect(game.turnDeadlineTs).toBe(deadlineAtStart + 3_000);
    expect(game.pendingAction).toBeDefined();
    expect(lastEmittedState().timerPaused).toBe(true);
  });

  test('auto-resuelve al tope de pausa: conserva la carta y pasa el turno', () => {
    // La pausa ya llevaba casi TIMER_PAUSE_MAX_MS: el siguiente tick debe auto-resolver
    const game = createGame({
      turnDeadlineTs: NOW + 5_000,
      pendingAction: { type: 'ApparitionDecision', playerId: 'p1', cardId: 'c9' },
      pauseStartedAt: NOW - (TIMER_PAUSE_MAX_MS - 500),
    });
    const games = new Map([[game.roomId, game]]);
    const turnTimers = new Map<string, NodeJS.Timeout>();
    const endTurn = jest.fn();

    scheduleTurnTimer(game.roomId, games, turnTimers, endTurn);

    jest.advanceTimersByTime(1_000); // 1 tick → pausa total = TIMER_PAUSE_MAX_MS + 500

    expect(game.pendingAction).toBeUndefined();
    expect(game.pauseStartedAt).toBeUndefined();
    expect(endTurn).toHaveBeenCalledWith(game.roomId);
    expect(lastEmittedState().timerPaused).toBe(false);
  });

  test('sin pendingAction: cuenta atrás normal y timerPaused=false', () => {
    const game = createGame({ turnDeadlineTs: NOW + 5_000 });
    const games = new Map([[game.roomId, game]]);
    const turnTimers = new Map<string, NodeJS.Timeout>();

    scheduleTurnTimer(game.roomId, games, turnTimers, jest.fn());

    const deadlineAtStart = game.turnDeadlineTs;
    jest.advanceTimersByTime(2_000);

    // Sin pausa: el deadline NO se compensa
    expect(game.turnDeadlineTs).toBe(deadlineAtStart);
    expect(lastEmittedState().timerPaused).toBe(false);
  });

  test('sin pendingAction y al expirar: descarta una carta aleatoria de la mano', () => {
    const game = createGame({ turnDeadlineTs: NOW + 1_500 });
    const games = new Map([[game.roomId, game]]);
    const turnTimers = new Map<string, NodeJS.Timeout>();
    const endTurn = jest.fn();

    // discardCardsInternal(games, endTurn) devuelve la función de descarte
    const mockDiscard = jest.fn();
    (discardCardsInternal as jest.Mock).mockReturnValue(mockDiscard);

    scheduleTurnTimer(game.roomId, games, turnTimers, endTurn);

    jest.advanceTimersByTime(2_000); // expira en el 2º tick

    expect(discardCardsInternal).toHaveBeenCalledTimes(1);
    expect(mockDiscard).toHaveBeenCalledTimes(1);
    const [room, player, cardIds] = mockDiscard.mock.calls[0];
    expect(room).toBe('room-timer');
    expect(player).toBe('p1');
    expect(cardIds).toHaveLength(1);
    expect(lastEmittedState().timerPaused).toBe(false);
  });
});
