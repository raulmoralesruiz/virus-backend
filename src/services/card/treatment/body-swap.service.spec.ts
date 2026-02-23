import { playBodySwap } from './body-swap.service.js';
import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState, BodySwapTarget } from '../../../interfaces/Game.interface.js';

const mkGame = (numPlayers = 2): GameState => {
  const g: GameState = {
    roomId: 'r1',
    deck: [],
    discard: [],
    players: [],
    public: { players: [] },
    startedAt: new Date().toISOString(),
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60000,
    history: [],
    lastActionAt: Date.now(),
  };

  for(let i = 0; i < numPlayers; i++) {
    const p = { id: `p${i+1}`, name: `P${i+1}` };
    g.players.push({ player: p, hand: [] });
    g.public.players.push({ player: p, handCount: 0, board: [] });
  }

  return g;
};

describe('playBodySwap', () => {
  test('falla si la dirección no es válida', () => {
    const g = mkGame();
    g.players[0].hand.push({
      id: 'body_swap_1',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.BodySwap,
    });
    const target = { direction: 'invalid-dir' as any };
    const res = playBodySwap(g, g.players[0], 0, target);
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.INVALID_TARGET });
  });

  test('no hace nada (pero gasta carta) si hay menos de 2 jugadores', () => {
    const g = mkGame(1);
    g.players[0].hand.push({
      id: 'body_swap_1',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.BodySwap,
    });
    const target: BodySwapTarget = { direction: 'clockwise' };
    const res = playBodySwap(g, g.players[0], 0, target);
    
    expect(res.success).toBe(true);
    expect(g.players[0].hand.length).toBe(0);
    expect(g.discard.length).toBe(1);
    expect(g.history[g.history.length - 1]).toContain('está solo');
  });

  test('intercambia cuerpos en sentido antihorario', () => {
    const g = mkGame(3); // p1, p2, p3
    // P1 tiene órgano verde
    g.public.players[0].board.push({ id: 'org_green', kind: CardKind.Organ, color: CardColor.Green, attached: [] });
    // P2 tiene órgano azul
    g.public.players[1].board.push({ id: 'org_blue', kind: CardKind.Organ, color: CardColor.Blue, attached: [] });
    // P3 tiene órgano rojo
    g.public.players[2].board.push({ id: 'org_red', kind: CardKind.Organ, color: CardColor.Red, attached: [] });

    g.players[0].hand.push({
      id: 'body_swap_1',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.BodySwap,
    });

    const target: BodySwapTarget = { direction: 'counter-clockwise' };
    const res = playBodySwap(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    // En antihorario, i pasa a i-1. El nuevo board para i es de i+1.
    // P1 (i=0) <- P2 (i=1) = Azul
    // P2 (i=1) <- P3 (i=2) = Rojo
    // P3 (i=2) <- P1 (i=0) = Verde
    expect(g.public.players[0].board[0].color).toBe(CardColor.Blue);
    expect(g.public.players[1].board[0].color).toBe(CardColor.Red);
    expect(g.public.players[2].board[0].color).toBe(CardColor.Green);
  });

  test('intercambia cuerpos en sentido horario', () => {
    const g = mkGame(3);
    g.public.players[0].board.push({ id: 'org_green', kind: CardKind.Organ, color: CardColor.Green, attached: [] });
    g.public.players[1].board.push({ id: 'org_blue', kind: CardKind.Organ, color: CardColor.Blue, attached: [] });
    g.public.players[2].board.push({ id: 'org_red', kind: CardKind.Organ, color: CardColor.Red, attached: [] });

    g.players[0].hand.push({
      id: 'body_swap_1',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.BodySwap,
    });

    const target: BodySwapTarget = { direction: 'clockwise' };
    const res = playBodySwap(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    // En horario, i pasa a i+1. El nuevo board para i es de i-1.
    // P1 (i=0) <- P3 (i=2) = Rojo
    // P2 (i=1) <- P1 (i=0) = Verde
    // P3 (i=2) <- P2 (i=1) = Azul
    expect(g.public.players[0].board[0].color).toBe(CardColor.Red);
    expect(g.public.players[1].board[0].color).toBe(CardColor.Green);
    expect(g.public.players[2].board[0].color).toBe(CardColor.Blue);
  });
});
