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
});
