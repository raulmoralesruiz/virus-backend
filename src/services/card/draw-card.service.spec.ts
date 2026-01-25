import { drawCardInternal, HAND_LIMIT } from './draw-card.service.js';
import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardKind, CardColor } from '../../interfaces/Card.interface.js';
import { GameState } from '../../interfaces/Game.interface.js';

const mkGame = (): GameState => {
  const p1 = { id: 'p1', name: 'P1' };
  const p2 = { id: 'p2', name: 'P2' };

  return {
    roomId: 'r1',
    deck: [],
    discard: [],
    players: [
      { player: p1, hand: [] },
      { player: p2, hand: [] },
    ],
    public: {
      players: [
        { player: p1, handCount: 0, board: [] },
        { player: p2, handCount: 0, board: [] },
      ],
    },
    startedAt: new Date().toISOString(),
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60000,
    history: [],
    lastActionAt: Date.now(),
  };
};

describe('drawCardInternal', () => {
  test('falla si la partida no existe', () => {
    const games = new Map();
    const draw = drawCardInternal(games);

    const res = draw('invalid', 'p1');
    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.GAME_NOT_FOUND,
    });
  });

  test('falla si el jugador no existe', () => {
    const g = mkGame();
    g.deck.push({ id: 'c1', kind: CardKind.Organ, color: CardColor.Green });
    const games = new Map([[g.roomId, g]]);
    const draw = drawCardInternal(games);

    const res = draw('r1', 'px');
    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.NO_PLAYER,
    });
  });

  test('falla si no quedan cartas en mazo ni descarte', () => {
    const g = mkGame();
    const games = new Map([[g.roomId, g]]);
    const draw = drawCardInternal(games);

    const res = draw('r1', 'p1');
    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.NO_CARDS_LEFT,
    });
  });

  test('recicla descarte cuando el mazo está vacío', () => {
    const g = mkGame();
    // Necesitamos al menos 2 cartas: una se queda en descarte (top) y otra va al mazo
    g.discard.push({ id: 'c1', kind: CardKind.Organ, color: CardColor.Green });
    g.discard.push({ id: 'c2', kind: CardKind.Virus, color: CardColor.Red }); // top
    const games = new Map([[g.roomId, g]]);
    const draw = drawCardInternal(games);

    const res = draw('r1', 'p1');
    expect(res.success).toBe(true);
    expect(g.players[0].hand.length).toBe(1);
    // El descarte debe conservar la última carta
    expect(g.discard.length).toBe(1);
    expect(g.discard[0].id).toBe('c2');
  });

  test('falla si se alcanza el límite de cartas en mano', () => {
    const g = mkGame();
    const handLimit = HAND_LIMIT;
    g.deck.push({ id: 'c1', kind: CardKind.Organ, color: CardColor.Green });
    g.players[0].hand = new Array(handLimit).fill(null).map((_, i) => ({
      id: `dummy_${i}`,
      kind: CardKind.Organ,
      color: CardColor.Blue,
    }));
    const games = new Map([[g.roomId, g]]);
    const draw = drawCardInternal(games);

    const res = draw('r1', 'p1');
    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.HAND_LIMIT_REACHED,
    });
  });

  test('roba carta correctamente y actualiza handCount público', () => {
    const g = mkGame();
    const card = { id: 'c1', kind: CardKind.Organ, color: CardColor.Green };
    g.deck.push(card);
    const games = new Map([[g.roomId, g]]);
    const draw = drawCardInternal(games);

    const res = draw('r1', 'p1');
    // Aseguramos en tiempo de ejecución que la llamada tuvo éxito
    if (!res.success) {
      throw new Error(`Expected success but got error: ${JSON.stringify(res.error)}`);
    }

    expect(res.success).toBe(true);
    expect(res.card).toEqual(card);

    expect(g.players[0].hand).toContain(card);
    expect(g.public.players[0].handCount).toBe(1);
  });
});
