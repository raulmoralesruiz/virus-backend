import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState, ContagionTarget } from '../../../interfaces/Game.interface.js';
import { playContagion } from './contagion.service.js';

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
    lastActionAt: Date.now(),
  };
};

describe('playContagion', () => {
  test('falla al mover un virus al órgano destino de distinto color', () => {
    const g = mkGame();

    // P1 con virus verde en órgano verde
    const fromOrganId = 'organ_green_p1';
    g.public.players[0].board.push({
      id: fromOrganId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [{ id: 'virus_green_1', kind: CardKind.Virus, color: CardColor.Green }],
    });

    // P2 con órgano rojo libre (NO debería permitir contagio)
    const toOrganId = 'organ_red_p2';
    g.public.players[1].board.push({
      id: toOrganId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'contagion_1',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const targets: ContagionTarget[] = [{ fromOrganId, toOrganId, toPlayerId: 'p2' }];

    const res = playContagion(g, g.players[0], 0, targets);
    expect(res.success).toBe(false);
    expect(res).toMatchObject({
      success: false,
      error: {
        code: GAME_ERRORS.COLOR_MISMATCH.code,
        message: 'El Virus Estómago no puede contagiar el Órgano Corazón.',
      },
    });
  });

  test('falla si no hay objetivos', () => {
    const g = mkGame();
    g.players[0].hand.push({
      id: 'contagion_2',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const res = playContagion(g, g.players[0], 0, []);
    expect(res.success).toBe(false);
    expect(res).toMatchObject({ error: GAME_ERRORS.NO_TARGET });
  });

  test('falla si el órgano de origen no existe', () => {
    const g = mkGame();
    g.players[0].hand.push({
      id: 'contagion_3',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const targets: ContagionTarget[] = [
      { fromOrganId: 'fake', toOrganId: 'organX', toPlayerId: 'p2' },
    ];

    const res = playContagion(g, g.players[0], 0, targets);
    expect(res.success).toBe(false);
    expect(res).toMatchObject({ error: GAME_ERRORS.NO_ORGAN });
  });

  test('falla si el órgano objetivo está infectado o vacunado', () => {
    const g = mkGame();

    // P1 con órgano infectado
    const fromOrganId = 'organ_p1';
    g.public.players[0].board.push({
      id: fromOrganId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'virus_red', kind: CardKind.Virus, color: CardColor.Red }],
    });

    // P2 con órgano vacunado
    const toOrganId = 'organ_p2';
    g.public.players[1].board.push({
      id: toOrganId,
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [{ id: 'med_blue', kind: CardKind.Medicine, color: CardColor.Blue }],
    });

    g.players[0].hand.push({
      id: 'contagion_4',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const targets: ContagionTarget[] = [{ fromOrganId, toOrganId, toPlayerId: 'p2' }];

    const res = playContagion(g, g.players[0], 0, targets);
    expect(res.success).toBe(false);
    expect(res).toMatchObject({ error: GAME_ERRORS.INVALID_TARGET });
  });

  test('falla si el órgano objetivo es inmune (2 medicinas)', () => {
    const g = mkGame();

    const fromOrganId = 'organ_p1';
    g.public.players[0].board.push({
      id: fromOrganId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'virus_red', kind: CardKind.Virus, color: CardColor.Red }],
    });

    const toOrganId = 'organ_p2';
    g.public.players[1].board.push({
      id: toOrganId,
      kind: CardKind.Organ,
      color: CardColor.Yellow,
      attached: [
        { id: 'med_yellow_1', kind: CardKind.Medicine, color: CardColor.Yellow },
        { id: 'med_yellow_2', kind: CardKind.Medicine, color: CardColor.Yellow },
      ],
    });

    g.players[0].hand.push({
      id: 'contagion_5',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const targets: ContagionTarget[] = [{ fromOrganId, toOrganId, toPlayerId: 'p2' }];

    const res = playContagion(g, g.players[0], 0, targets);
    expect(res.success).toBe(false);
    expect(res).toMatchObject({
      success: false,
      error: {
        code: GAME_ERRORS.IMMUNE_ORGAN.code,
        message: 'El Órgano Hueso es inmune; no puedes contagiarlo.',
      },
    });
  });

  test('puede contagiar virus a varios jugadores diferentes', () => {
    const g = mkGame();

    // P1 con dos órganos infectados
    const from1 = 'org1_p1';
    const from2 = 'org2_p1';
    g.public.players[0].board.push({
      id: from1,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [{ id: 'virus-green-1', kind: CardKind.Virus, color: CardColor.Green }],
    });
    g.public.players[0].board.push({
      id: from2,
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [{ id: 'virus-blue-1', kind: CardKind.Virus, color: CardColor.Blue }],
    });

    // P2 y P3 con órganos libres y de color correcto
    const to1 = 'org_p2';
    g.public.players[1].board.push({
      id: to1,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    const to2 = 'org_p3';
    g.public.players[2].board.push({
      id: to2,
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'contagion_multi',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const targets: ContagionTarget[] = [
      { fromOrganId: from1, toOrganId: to1, toPlayerId: 'p2' },
      { fromOrganId: from2, toOrganId: to2, toPlayerId: 'p3' },
    ];

    const res = playContagion(g, g.players[0], 0, targets);
    expect(res.success).toBe(true);

    // virus movidos a jugadores distintos
    expect(g.public.players[1].board[0].attached.some(a => a.kind === CardKind.Virus)).toBe(true);
    expect(g.public.players[2].board[0].attached.some(a => a.kind === CardKind.Virus)).toBe(true);

    // órganos de P1 vacíos
    expect(g.public.players[0].board[0].attached.length).toBe(0);
    expect(g.public.players[0].board[1].attached.length).toBe(0);
  });

  test('ignora un órgano origen que no tiene virus (cubre el continue)', () => {
    const g = mkGame();

    // P1 con un órgano verde sin virus
    const fromId = 'org_from_p1';
    g.public.players[0].board.push({
      id: fromId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [], // sin virus
    });

    // P2 con órgano verde libre
    const toId = 'org_to_p2';
    g.public.players[1].board.push({
      id: toId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    // Mano: contagio
    g.players[0].hand.push({
      id: 'contagion_1',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const targets: ContagionTarget[] = [{ fromOrganId: fromId, toOrganId: toId, toPlayerId: 'p2' }];

    const res = playContagion(g, g.players[0], 0, targets);

    // Éxito aunque no se haya movido nada (cubre el continue)
    expect(res.success).toBe(true);

    // No se movió ningún virus
    expect(g.public.players[1].board[0].attached.length).toBe(0);
  });

  test('falla si el jugador destino no existe (INVALID_TARGET)', () => {
    const g = mkGame();

    // P1 con órgano infectado
    const fromId = 'org_from_p1';
    g.public.players[0].board.push({
      id: fromId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [{ id: 'virus1', kind: CardKind.Virus, color: CardColor.Green }],
    });

    g.players[0].hand.push({
      id: 'contagion_invalid_target',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const targets: ContagionTarget[] = [
      { fromOrganId: fromId, toOrganId: 'fake_organ', toPlayerId: 'no_such_player' },
    ];

    const res = playContagion(g, g.players[0], 0, targets);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.INVALID_TARGET,
    });
  });

  test('falla si el órgano destino no existe en el jugador válido (NO_ORGAN)', () => {
    const g = mkGame();

    // P1 con órgano infectado
    const fromId = 'org_from_p1';
    g.public.players[0].board.push({
      id: fromId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [{ id: 'virus1', kind: CardKind.Virus, color: CardColor.Green }],
    });

    // P2 con tablero vacío (no tiene el órgano al que queremos contagiar)
    g.public.players[1].board = [];

    g.players[0].hand.push({
      id: 'contagion_no_organ',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Contagion,
    });

    const targets: ContagionTarget[] = [
      { fromOrganId: fromId, toOrganId: 'nonexistent_organ', toPlayerId: 'p2' },
    ];

    const res = playContagion(g, g.players[0], 0, targets);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.NO_ORGAN,
    });
  });
});
