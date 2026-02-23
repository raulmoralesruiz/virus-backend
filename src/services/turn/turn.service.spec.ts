import { GameState } from '../../interfaces/Game.interface.js';
import { CardColor, CardKind } from '../../interfaces/Card.interface.js';
import { HAND_LIMIT } from '../card/draw-card.service.js';

jest.mock('../turn-timer.service.js', () => ({
  __esModule: true,
  scheduleTurnTimer: jest.fn(),
}));

const createCard = (id: string) => ({
  id,
  kind: CardKind.Organ,
  color: CardColor.Red,
});

describe('endTurnInternal', () => {
  test('jugador saltado roba nuevas cartas y conserva turno saltado', async () => {
    const roomId = 'room-1';
    const player1 = { id: 'p1', name: 'Player 1' };
    const player2 = { id: 'p2', name: 'Player 2' };

    const previousHand = [createCard('old-1'), createCard('old-2')];

    const game: GameState = {
      roomId,
      deck: [createCard('deck-1'), createCard('deck-2'), createCard('deck-3')],
      discard: [...previousHand],
      players: [
        { player: player1, hand: [createCard('p1_hand')], skipNextTurn: false },
        { player: player2, hand: [], skipNextTurn: true },
      ],
      public: {
        players: [
          { player: player1, handCount: 1, board: [] },
          { player: player2, handCount: 0, board: [] },
        ],
      },
      startedAt: new Date().toISOString(),
      turnIndex: 0,
      turnStartedAt: Date.now(),
      turnDeadlineTs: Date.now() + 60_000,
      history: [],
      lastActionAt: Date.now(),
    };

    const games = new Map<string, GameState>();
    const turnTimers = new Map<string, NodeJS.Timeout>();
    games.set(roomId, game);

    const { endTurnInternal } = await import('./turn.service.js');
    const endTurn = endTurnInternal(games, turnTimers);

    const result = endTurn(roomId);
    expect(result).toBe(game);

    const skippedPlayer = game.players[1];
    const skippedIds = skippedPlayer.hand.map(card => card.id);

    expect(skippedPlayer.skipNextTurn).toBe(false);
    expect(skippedPlayer.hand.length).toBe(HAND_LIMIT);
    expect(skippedIds.every(id => !previousHand.some(prev => prev.id === id))).toBe(true);
    expect(game.public.players[1].handCount).toBe(HAND_LIMIT);
    expect(game.turnIndex).toBe(0);
  });

  test('al saltar turno, rompe el loop si drawCard falla por falta de cartas', async () => {
    const roomId = 'room-empty';
    const player1 = { id: 'p1', name: 'Player 1' };
    const player2 = { id: 'p2', name: 'Player 2' };

    const game: GameState = {
      roomId,
      deck: [], // vacío
      discard: [], // vacío
      players: [
        { player: player1, hand: [createCard('p1_hand')], skipNextTurn: false },
        { player: player2, hand: [], skipNextTurn: true },
      ],
      public: {
        players: [
          { player: player1, handCount: 1, board: [] },
          { player: player2, handCount: 0, board: [] },
        ],
      },
      startedAt: new Date().toISOString(),
      turnIndex: 0,
      turnStartedAt: Date.now(),
      turnDeadlineTs: Date.now() + 60_000,
      history: [],
      lastActionAt: Date.now(),
    };

    const games = new Map<string, GameState>();
    const turnTimers = new Map<string, NodeJS.Timeout>();
    games.set(roomId, game);

    const { endTurnInternal } = await import('./turn.service.js');
    const endTurn = endTurnInternal(games, turnTimers);
    endTurn(roomId);

    expect(game.players[1].hand.length).toBe(0);
    expect(game.turnIndex).toBe(0); 
  });

  test('no falla si el jugador público no existe al saltar turno', async () => {
    const roomId = 'room-no-pub';
    const player1 = { id: 'p1', name: 'Player 1' };
    const player2 = { id: 'p2', name: 'Player 2' };

    const game: GameState = {
      roomId,
      deck: [createCard('deck-1')],
      discard: [],
      players: [
        { player: player1, hand: [createCard('p1_hand')], skipNextTurn: false },
        { player: player2, hand: [], skipNextTurn: true },
      ],
      public: {
        players: [
          { player: player1, handCount: 1, board: [] },
          // P2 NO TIENE PUBLIC
        ],
      },
      startedAt: new Date().toISOString(),
      turnIndex: 0,
      turnStartedAt: Date.now(),
      turnDeadlineTs: Date.now() + 60_000,
      history: [],
      lastActionAt: Date.now(),
    };

    const games = new Map<string, GameState>();
    const turnTimers = new Map<string, NodeJS.Timeout>();
    games.set(roomId, game);

    const { endTurnInternal } = await import('./turn.service.js');
    const endTurn = endTurnInternal(games, turnTimers);
    endTurn(roomId);

    expect(game.turnIndex).toBe(0); 
  });

  test('limpia pendingAction si existe', async () => {
    const games = new Map<string, GameState>();
    const turnTimers = new Map<string, NodeJS.Timeout>();
    const game = {
      roomId: 'r1',
      players: [{ player: { id: 'p1' }, hand: [], skipNextTurn: false }],
      turnIndex: 0,
      pendingAction: { type: 'something', targetPlayerId: 'p2' },
      public: { players: [{ player: { id: 'p1' } }] }
    } as any;
    games.set('r1', game);

    const { endTurnInternal } = await import('./turn.service.js');
    const endTurn = endTurnInternal(games, turnTimers);
    endTurn('r1');

    expect(game.pendingAction).toBeUndefined();
  });

  test('devuelve null si no encuentra el juego', async () => {
    const games = new Map<string, GameState>();
    const turnTimers = new Map<string, NodeJS.Timeout>();
    const { endTurnInternal } = await import('./turn.service.js');
    const endTurn = endTurnInternal(games, turnTimers);
    expect(endTurn('r1')).toBeNull();
  });
});

describe('isPlayersTurnInternal', () => {
  test('devuelve falso si no encuentra el juego', async () => {
    const games = new Map<string, GameState>();
    const { isPlayersTurnInternal } = await import('./turn.service.js');
    const isTurn = isPlayersTurnInternal(games);
    expect(isTurn('r1', 'p1')).toBe(false);
  });

  test('devuelve true si el id del jugador coincide con el del turno actual', async () => {
    const games = new Map<string, GameState>();
    games.set('r1', { players: [{ player: { id: 'p1' } }, { player: { id: 'p2' } }], turnIndex: 0 } as any);
    const { isPlayersTurnInternal } = await import('./turn.service.js');
    const isTurn = isPlayersTurnInternal(games);
    expect(isTurn('r1', 'p1')).toBe(true);
    expect(isTurn('r1', 'p2')).toBe(false);
  });
});

describe('clearGameInternal', () => {
  test('limpia el timer y elimina el juego', async () => {
    const games = new Map<string, GameState>();
    const turnTimers = new Map<string, NodeJS.Timeout>();
    const timer = setTimeout(() => {}, 10000);
    turnTimers.set('r1', timer);
    games.set('r1', {} as any);

    const { clearGameInternal } = await import('./turn.service.js');
    const clearGame = clearGameInternal(games, turnTimers);
    clearGame('r1');
    
    expect(turnTimers.has('r1')).toBe(false);
    expect(games.has('r1')).toBe(false);
    clearTimeout(timer); // clean test environment just in case
  });

  test('funciona sin errores si no hay timer', async () => {
    const games = new Map<string, GameState>();
    const turnTimers = new Map<string, NodeJS.Timeout>();
    games.set('r1', {} as any);

    const { clearGameInternal } = await import('./turn.service.js');
    const clearGame = clearGameInternal(games, turnTimers);
    clearGame('r1');
    
    expect(games.has('r1')).toBe(false);
  });
});
