import { playGlove } from './glove.service.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState } from '../../../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../../../constants/error.constants.js';

const mkGame = (): GameState => {
  const p1 = { id: 'p1', name: 'P1' };
  const p2 = { id: 'p2', name: 'P2' };
  const p3 = { id: 'p3', name: 'P3' };

  return {
    roomId: 'r1',
    deck: [],
    discard: [],
    players: [
      { player: p1, hand: [] },
      { player: p2, hand: [] },
      { player: p3, hand: [] },
    ],
    public: {
      players: [
        { player: p1, handCount: 0, board: [] },
        { player: p2, handCount: 0, board: [] },
        { player: p3, handCount: 0, board: [] },
      ],
    },
    startedAt: new Date().toISOString(),
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60000,
    history: [],
  };
};

describe('playGlove', () => {
  test('otros jugadores descartan todas sus cartas', () => {
    const g = mkGame();

    // P1 (jugador actual) tiene el guante
    g.players[0].hand.push({
      id: 'glove_1',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Gloves,
    });

    // P2 y P3 tienen cartas en mano
    g.players[1].hand.push({ id: 'p2_card1', kind: CardKind.Organ, color: CardColor.Red });
    g.players[1].hand.push({ id: 'p2_card2', kind: CardKind.Organ, color: CardColor.Green });
    g.players[2].hand.push({ id: 'p3_card1', kind: CardKind.Organ, color: CardColor.Blue });

    // Actualizar contadores públicos
    g.public.players[1].handCount = g.players[1].hand.length;
    g.public.players[2].handCount = g.players[2].hand.length;

    const res = playGlove(g, g.players[0], 0);

    expect(res.success).toBe(true);

    // P2 y P3 deben quedar con mano vacía
    expect(g.players[1].hand.length).toBe(0);
    expect(g.players[2].hand.length).toBe(0);

    // Public state también actualizado
    expect(g.public.players[1].handCount).toBe(0);
    expect(g.public.players[2].handCount).toBe(0);

    // Sus cartas deben estar en el descarte
    expect(g.discard.find(c => c.id === 'p2_card1')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'p2_card2')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'p3_card1')).toBeTruthy();

    // El guante también debe estar en el descarte
    expect(g.discard.find(c => c.id === 'glove_1')).toBeTruthy();

    // P1 mantiene sus cartas (excepto el guante usado)
    expect(g.players[0].hand.length).toBe(0);
  });

  test('falla si el jugador no tiene la carta en mano', () => {
    const g = mkGame();

    const res = playGlove(g, g.players[0], 0);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.NO_CARD,
    });
  });

  test('no descarta al jugador que juega el guante', () => {
    const g = mkGame();

    // P1 (jugador actual) tiene el guante y otra carta
    g.players[0].hand.push({
      id: 'glove_1',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Gloves,
    });
    g.players[0].hand.push({
      id: 'p1_card1',
      kind: CardKind.Organ,
      color: CardColor.Red,
    });

    // P2 tiene cartas en mano
    g.players[1].hand.push({ id: 'p2_card1', kind: CardKind.Organ, color: CardColor.Green });

    const res = playGlove(g, g.players[0], 0);
    expect(res.success).toBe(true);

    // P1 conserva su carta adicional
    expect(g.players[0].hand.length).toBe(1);
    expect(g.players[0].hand[0].id).toBe('p1_card1');

    // P2 descartó su carta
    expect(g.players[1].hand.length).toBe(0);
  });
});
