import { Server, Socket } from 'socket.io';

// --- Mocks de dependencias de los handlers de selección ---
jest.mock('../services/game.service.js', () => ({
  __esModule: true,
  startGame: jest.fn(),
  getPublicState: jest.fn(() => ({ roomId: 'r1' })),
  getPlayerHand: jest.fn(() => []),
  drawCard: jest.fn(),
  isPlayersTurn: jest.fn(() => true),
  endTurn: jest.fn(),
  playCard: jest.fn(),
  getGame: jest.fn(),
  discardCards: jest.fn(),
  clearGame: jest.fn(),
}));

jest.mock('../services/room.service.js', () => ({
  __esModule: true,
  getRooms: jest.fn(() => [
    { id: 'r1', players: [{ id: 'p1' }, { id: 'p2' }] },
  ]),
  setRoomInProgress: jest.fn(),
}));

jest.mock('../ws/emitter.js', () => ({
  __esModule: true,
  wsEmitter: { on: jest.fn() },
}));

import { getGame, isPlayersTurn } from '../services/game.service.js';
import { GAME_CONSTANTS } from '../constants/game.constants.js';
import { GAME_ERRORS } from '../constants/error.constants.js';
import registerGameEvents from './game.events.js';

interface MockSocket {
  data?: { playerId: string };
  on: jest.Mock;
  emit: jest.Mock;
  trigger: (event: string, ...args: any[]) => void;
}

const mkSocket = (playerId?: string): MockSocket => {
  const handlers: Record<string, (...args: any[]) => void> = {};
  return {
    data: playerId ? { playerId } : undefined,
    on: jest.fn((event: string, fn: (...args: any[]) => void) => {
      handlers[event] = fn;
    }),
    emit: jest.fn(),
    trigger: (event: string, ...args: any[]) => handlers[event](...args),
  };
};

const mkIo = () => {
  const emit = jest.fn();
  return { io: { to: jest.fn().mockReturnValue({ emit }) } as unknown as Server, emit };
};

const baseGame = () =>
  ({
    roomId: 'r1',
    players: [{ player: { id: 'p1', name: 'Alice' }, hand: [{ id: 'c1' }] }],
    pendingAction: undefined as any,
    pauseStartedAt: undefined as any,
  }) as any;

describe('game:selection-start / game:selection-cancel', () => {
  const game = baseGame();

  beforeEach(() => {
    (getGame as jest.Mock).mockReturnValue(game);
    (isPlayersTurn as jest.Mock).mockReturnValue(true);
    game.pendingAction = undefined;
    game.pauseStartedAt = undefined;
  });

  test('marca TargetSelection pendiente y emite el estado público', () => {
    const { io, emit } = mkIo();
    const socket = mkSocket('p1');
    registerGameEvents(io, socket as unknown as Socket);

    socket.trigger(GAME_CONSTANTS.GAME_SELECTION_START, { roomId: 'r1', cardId: 'c1' });

    expect(game.pendingAction).toEqual({ type: 'TargetSelection', playerId: 'p1', cardId: 'c1' });
    expect(io.to).toHaveBeenCalledWith('r1');
    expect(emit).toHaveBeenCalledWith(GAME_CONSTANTS.GAME_STATE, expect.anything());
  });

  test('rechaza si no es el turno del jugador (NOT_YOUR_TURN)', () => {
    (isPlayersTurn as jest.Mock).mockReturnValue(false);
    const { io } = mkIo();
    const socket = mkSocket('p1');
    registerGameEvents(io, socket as unknown as Socket);

    socket.trigger(GAME_CONSTANTS.GAME_SELECTION_START, { roomId: 'r1', cardId: 'c1' });

    expect(game.pendingAction).toBeUndefined();
    expect(socket.emit).toHaveBeenCalledWith(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NOT_YOUR_TURN);
    expect(io.to).not.toHaveBeenCalled();
  });

  test('rechaza si la carta no está en la mano (NO_CARD)', () => {
    const { io } = mkIo();
    const socket = mkSocket('p1');
    registerGameEvents(io, socket as unknown as Socket);

    socket.trigger(GAME_CONSTANTS.GAME_SELECTION_START, { roomId: 'r1', cardId: 'no-existe' });

    expect(game.pendingAction).toBeUndefined();
    expect(socket.emit).toHaveBeenCalledWith(GAME_CONSTANTS.GAME_ERROR, GAME_ERRORS.NO_CARD);
    expect(io.to).not.toHaveBeenCalled();
  });

  test('cancel: limpia la TargetSelection pendiente y emite el estado', () => {
    game.pendingAction = { type: 'TargetSelection', playerId: 'p1', cardId: 'c1' };
    game.pauseStartedAt = 123;

    const { io, emit } = mkIo();
    const socket = mkSocket('p1');
    registerGameEvents(io, socket as unknown as Socket);

    socket.trigger(GAME_CONSTANTS.GAME_SELECTION_CANCEL, { roomId: 'r1' });

    expect(game.pendingAction).toBeUndefined();
    expect(game.pauseStartedAt).toBeUndefined();
    expect(emit).toHaveBeenCalledWith(GAME_CONSTANTS.GAME_STATE, expect.anything());
  });

  test('cancel: sin acción pendiente no emite nada', () => {
    const { io } = mkIo();
    const socket = mkSocket('p1');
    registerGameEvents(io, socket as unknown as Socket);

    socket.trigger(GAME_CONSTANTS.GAME_SELECTION_CANCEL, { roomId: 'r1' });

    expect(game.pendingAction).toBeUndefined();
    expect(io.to).not.toHaveBeenCalled();
  });

  test('cancel: no limpia una acción pendiente de otro jugador', () => {
    game.pendingAction = { type: 'TargetSelection', playerId: 'p2', cardId: 'c9' };

    const { io } = mkIo();
    const socket = mkSocket('p1');
    registerGameEvents(io, socket as unknown as Socket);

    socket.trigger(GAME_CONSTANTS.GAME_SELECTION_CANCEL, { roomId: 'r1' });

    expect(game.pendingAction).toEqual({ type: 'TargetSelection', playerId: 'p2', cardId: 'c9' });
    expect(io.to).not.toHaveBeenCalled();
  });
});
