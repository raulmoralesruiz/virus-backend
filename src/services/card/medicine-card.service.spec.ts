import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardKind, CardColor } from '../../interfaces/Card.interface.js';
import { GameState, PlayCardTarget } from '../../interfaces/Game.interface.js';
import { playMedicineCard } from './medicine-card.service.js';

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

describe('playMedicineCard', () => {
  test('falla si no hay objetivos', () => {
    const g = mkGame();
    g.players[0].hand.push({
      id: 'med_green_1',
      kind: CardKind.Medicine,
      color: CardColor.Green,
    });

    const res = playMedicineCard(g, g.players[0], 0, undefined);
    expect(res.success).toBe(false);
    expect(res).toMatchObject({ error: GAME_ERRORS.NO_TARGET });
  });

  test('vacuna un órgano libre (añade medicina)', () => {
    const g = mkGame();
    const organId = 'organ_green_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'med_green_1',
      kind: CardKind.Medicine,
      color: CardColor.Green,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playMedicineCard(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.some(a => a.kind === CardKind.Medicine)).toBe(true);
    expect(g.players[0].hand.length).toBe(0);
  });

  test('cura un virus', () => {
    const g = mkGame();
    const organId = 'organ_red_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'virus_red_1', kind: CardKind.Virus, color: CardColor.Red }],
    });

    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playMedicineCard(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(0);

    expect(g.discard.find(c => c.id === 'virus_red_1')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'med_red_1')).toBeTruthy();

    expect(g.players[0].hand.length).toBe(0);
  });

  test('falla al intentar curar un virus en órgano multicolor si los colores difieren', () => {
    const g = mkGame();
    const organId = 'organ_multi_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Multi,
      attached: [{ id: 'virus_yellow_1', kind: CardKind.Virus, color: CardColor.Yellow }],
    });

    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playMedicineCard(g, g.players[0], 0, target);

    expect(res.success).toBe(false);
    expect(res).toMatchObject({
      error: {
        code: GAME_ERRORS.COLOR_MISMATCH.code,
      },
    });

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(1); // Virus keeps attached
    expect(g.players[0].hand.length).toBe(1); // Card not played
  });

  test('hace inmune un órgano con dos medicinas', () => {
    const g = mkGame();
    const organId = 'organ_yellow_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Yellow,
      attached: [{ id: 'med_yellow_a', kind: CardKind.Medicine, color: CardColor.Yellow }],
    });

    g.players[0].hand.push({
      id: 'med_yellow_b',
      kind: CardKind.Medicine,
      color: CardColor.Yellow,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playMedicineCard(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(2);
    expect(g.players[0].hand.length).toBe(0);
  });

  test('falla si la medicina no coincide en color', () => {
    const g = mkGame();
    const organId = 'organ_blue_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'med_green_1',
      kind: CardKind.Medicine,
      color: CardColor.Green,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playMedicineCard(g, g.players[0], 0, target);

    expect(res.success).toBe(false);
    expect(res).toMatchObject({
      success: false,
      error: {
        code: GAME_ERRORS.COLOR_MISMATCH.code,
        message: 'La Medicina Estómago no se puede aplicar sobre el Órgano Cerebro.',
      },
    });

    expect(g.players[0].hand.length).toBe(1);
  });

  test('falla en órgano inmune', () => {
    const g = mkGame();
    const organId = 'organ_green_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [
        { id: 'med_green_a', kind: CardKind.Medicine, color: CardColor.Green },
        { id: 'med_green_b', kind: CardKind.Medicine, color: CardColor.Green },
      ],
    });

    g.players[0].hand.push({
      id: 'med_green_c',
      kind: CardKind.Medicine,
      color: CardColor.Green,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playMedicineCard(g, g.players[0], 0, target);

    expect(res.success).toBe(false);
    expect(res).toMatchObject({
      success: false,
      error: {
        code: GAME_ERRORS.ALREADY_IMMUNE.code,
        message: 'El Órgano Estómago ya es inmune; no puedes añadir más medicinas.',
      },
    });

    expect(g.players[0].hand.length).toBe(1);
  });

  test('medicina multicolor puede vacunar órgano de cualquier color', () => {
    const g = mkGame();
    const organId = 'organ_blue_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'med_multi_1',
      kind: CardKind.Medicine,
      color: CardColor.Multi,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playMedicineCard(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.some(a => a.kind === CardKind.Medicine)).toBe(true);
  });

  test('medicina normal puede vacunar órgano multicolor', () => {
    const g = mkGame();
    const organId = 'organ_multi_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Multi,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playMedicineCard(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.some(a => a.kind === CardKind.Medicine)).toBe(true);
  });

  test('neutraliza si la medicina es Multi y el virus es de un color específico', () => {
    const g = mkGame();
    const organId = 'organ_red_1';

    // Órgano rojo con virus rojo
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'virus_red_1', kind: CardKind.Virus, color: CardColor.Red }],
    });

    // Mano de P1: medicina Multi
    g.players[0].hand.push({
      id: 'med_multi_1',
      kind: CardKind.Medicine,
      color: CardColor.Multi,
    });

    const res = playMedicineCard(g, g.players[0], 0, { playerId: 'p2', organId });
    expect(res.success).toBe(true);

    // Órgano queda libre
    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(0);

    // Ambos al descarte
    expect(g.discard.find(c => c.id === 'virus_red_1')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'med_multi_1')).toBeTruthy();
  });

  test('neutraliza si el virus es Multi y la medicina es de un color específico', () => {
    const g = mkGame();
    const organId = 'organ_green_1';

    // Órgano verde con virus Multi
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [{ id: 'virus_multi_1', kind: CardKind.Virus, color: CardColor.Multi }],
    });

    // Mano de P1: medicina verde
    g.players[0].hand.push({
      id: 'med_green_1',
      kind: CardKind.Medicine,
      color: CardColor.Green,
    });

    const res = playMedicineCard(g, g.players[0], 0, { playerId: 'p2', organId });
    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(0);

    // Ambos al descarte
    expect(g.discard.find(c => c.id === 'virus_multi_1')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'med_green_1')).toBeTruthy();
  });

  test('NO_TARGET -> debe fallar si no se pasa target', () => {
    const g = mkGame();
    // poner la carta de medicina en la mano del jugador 1
    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    // Llamada sin target
    const res = playMedicineCard(g, g.players[0], 0, undefined);
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.NO_TARGET });
  });

  test('INVALID_TARGET -> debe fallar si el player objetivo no existe', () => {
    const g = mkGame();
    // poner la carta de medicina en la mano del jugador 1
    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    // target con playerId inexistente
    const res = playMedicineCard(g, g.players[0], 0, {
      playerId: 'not-a-player',
      organId: 'whatever',
    });
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.INVALID_TARGET });
  });

  test('NO_ORGAN -> debe fallar si el organId no existe en el tablero del objetivo', () => {
    const g = mkGame();
    // poner la carta de medicina en la mano del jugador 1
    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    // target válido (p2) pero sin órganos en su board
    const res = playMedicineCard(g, g.players[0], 0, { playerId: 'p2', organId: 'nonexistent' });
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.NO_ORGAN });
  });
});
