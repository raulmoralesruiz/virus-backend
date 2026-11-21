import { Server, Socket } from 'socket.io';

jest.mock('../services/player.service.js', () => ({
  __esModule: true,
  getPlayerById: jest.fn(),
  setPlayerSocketId: jest.fn(),
  clearPlayerSocketId: jest.fn(),
}));

jest.mock('../utils/logger.js', () => ({
  __esModule: true,
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../services/room.service.js', () => ({
  __esModule: true,
  getRooms: jest.fn(() => []),
}));

jest.mock('../ws/emitter.js', () => ({
  __esModule: true,
  wsEmitter: { emitRoomUpdated: jest.fn() },
}));

jest.mock('../services/game.service.js', () => ({
  __esModule: true,
  getGame: jest.fn(),
  getPlayerHand: jest.fn(() => []),
  getPublicState: jest.fn(),
}));

import { PLAYER_CONSTANTS } from '../constants/player.constants.js';
import registerPlayerEvents from './player.events.js';

interface MockSocket {
  data?: { playerId: string };
  on: jest.Mock;
  emit: jest.Mock;
  trigger: (event: string, ...args: any[]) => void;
}

const mkSocket = (): MockSocket => {
  const handlers: Record<string, (...args: any[]) => void> = {};
  return {
    on: jest.fn((event: string, fn: (...args: any[]) => void) => {
      handlers[event] = fn;
    }),
    emit: jest.fn(),
    trigger: (event: string, ...args: any[]) => handlers[event](...args),
  };
};

const mkIo = () => ({ io: {} as unknown as Server, emit: jest.fn() });

describe('client:ping (liveness probe)', () => {
  test('ack con "pong" cuando el cliente envía un callback de ack', () => {
    const { io } = mkIo();
    const socket = mkSocket();
    registerPlayerEvents(io as unknown as Server, socket as unknown as Socket);

    const ack = jest.fn();
    socket.trigger(PLAYER_CONSTANTS.CLIENT_PING, ack);

    expect(ack).toHaveBeenCalledWith('pong');
  });

  test('no tira si el cliente no envía ack', () => {
    const { io } = mkIo();
    const socket = mkSocket();
    registerPlayerEvents(io as unknown as Server, socket as unknown as Socket);

    expect(() => socket.trigger(PLAYER_CONSTANTS.CLIENT_PING)).not.toThrow();
  });

  test('responde el ping aunque el socket no esté identificado', () => {
    const { io } = mkIo();
    const socket = mkSocket(); // sin data.playerId
    registerPlayerEvents(io as unknown as Server, socket as unknown as Socket);

    const ack = jest.fn();
    socket.trigger(PLAYER_CONSTANTS.CLIENT_PING, ack);

    expect(ack).toHaveBeenCalledWith('pong');
    expect(socket.emit).not.toHaveBeenCalled();
  });
});
