import { GameState } from '../../interfaces/Game.interface.js';
import { mapToPublicState } from './query.service.js';
import { TURN_DURATION_MS } from '../../constants/turn.constants.js';

const createGame = (overrides: Partial<GameState> = {}): GameState =>
  ({
    roomId: 'room-1',
    deck: [],
    discard: [],
    players: [{ player: { id: 'p1', name: 'Alice' }, hand: [] }],
    public: {
      players: [{ player: { id: 'p1', name: 'Alice' }, handCount: 0, board: [] }],
    },
    startedAt: new Date().toISOString(),
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60_000,
    history: [],
    lastActionAt: Date.now(),
    ...overrides,
  }) as GameState;

describe('mapToPublicState.turnDurationSeconds', () => {
  test('expone la duración real del turno (turnDurationMs)', () => {
    const publicState = mapToPublicState(createGame({ turnDurationMs: 90_000 }));
    expect(publicState.turnDurationSeconds).toBe(90);
  });

  test('cae a TURN_DURATION_MS si turnDurationMs no existe', () => {
    const publicState = mapToPublicState(createGame());
    expect(publicState.turnDurationSeconds).toBe(Math.round(TURN_DURATION_MS / 1000));
  });
});
