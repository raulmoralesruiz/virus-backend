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
  };
};

describe('playMedicineCard', () => {
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
      error: GAME_ERRORS.COLOR_MISMATCH,
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
      error: GAME_ERRORS.ALREADY_IMMUNE,
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
});
