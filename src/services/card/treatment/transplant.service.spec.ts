import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState, OrganOnBoard, PlayCardTarget } from '../../../interfaces/Game.interface.js';
import { playTransplant } from './transplant.service.js';

// Helper para crear un estado de juego básico con N jugadores
const mkGame = (nPlayers = 2): GameState => {
  const players = Array.from({ length: nPlayers }, (_, i) => ({
    id: `p${i + 1}`,
    name: `P${i + 1}`,
  }));

  return {
    roomId: 'r1',
    deck: [],
    discard: [],
    players: players.map(p => ({ player: p, hand: [] })),
    public: {
      players: players.map(p => ({ player: p, handCount: 0, board: [] })),
    },
    startedAt: new Date().toISOString(),
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60000,
    history: [],
    lastActionAt: Date.now(),
  };
};

describe('playTransplant', () => {
  test('intercambia dos órganos correctamente', () => {
    const g = mkGame(2);

    const organA: OrganOnBoard = {
      id: 'org_p1_red',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    };
    const organB: OrganOnBoard = {
      id: 'org_p2_green',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    };

    g.public.players[0].board.push(organA);
    g.public.players[1].board.push(organB);

    // poner la carta de tratamiento en la mano del jugador 1
    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: organA.id },
      { playerId: 'p2', organId: organB.id }
    );

    expect(res.success).toBe(true);

    // Los órganos deben haber cambiado de dueño (ids intercambiadas en tablero público)
    expect(g.public.players[0].board[0].id).toBe('org_p2_green');
    expect(g.public.players[1].board[0].id).toBe('org_p1_red');

    // Carta gastada y descartada
    expect(g.players[0].hand.length).toBe(0);
    expect(g.discard.find(c => c.id === 'treatment_transplant')).toBeTruthy();
  });

  test('falla si alguno de los objetivos no existe', () => {
    const g = mkGame(2);

    // meter la carta en la mano del jugador 1
    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: 'non_existent' },
      { playerId: 'p2', organId: 'also_fake' }
    );

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.NO_ORGAN,
    });
  });

  test('falla si uno de los órganos es inmune (2 medicinas)', () => {
    const g = mkGame(2);

    const immuneOrgan: OrganOnBoard = {
      id: 'org_p1_yellow',
      kind: CardKind.Organ,
      color: CardColor.Yellow,
      attached: [
        { id: 'med1', kind: CardKind.Medicine, color: CardColor.Yellow },
        { id: 'med2', kind: CardKind.Medicine, color: CardColor.Yellow },
      ],
    };
    const otherOrgan: OrganOnBoard = {
      id: 'org_p2_blue',
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    };

    g.public.players[0].board.push(immuneOrgan);
    g.public.players[1].board.push(otherOrgan);

    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: immuneOrgan.id },
      { playerId: 'p2', organId: otherOrgan.id }
    );

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.IMMUNE_ORGAN,
    });

    // Carta sigue en mano porque no se jugó
    expect(g.players[0].hand.length).toBe(1);
  });

  test('falla si el intercambio produce órganos duplicados en un jugador', () => {
    const g = mkGame(2);

    const organA: OrganOnBoard = {
      id: 'org_p1_red',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    };
    const organB: OrganOnBoard = {
      id: 'org_p2_green',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    };

    g.public.players[0].board.push(organA);
    g.public.players[1].board.push(organB);

    // P2 ya tiene otro rojo -> provocará duplicado tras el swap
    g.public.players[1].board.push({
      id: 'org_p2_red',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: organA.id },
      { playerId: 'p2', organId: organB.id }
    );

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.DUPLICATE_ORGAN,
    });

    // Carta sigue en mano
    expect(g.players[0].hand.length).toBe(1);
  });

  test('intercambia órganos con sus anexos (virus/medicina) - completo', () => {
    const g = mkGame(2);

    const organA: OrganOnBoard = {
      id: 'org_p1_red',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'virus_r1', kind: CardKind.Virus, color: CardColor.Red }],
    };
    const organB: OrganOnBoard = {
      id: 'org_p2_green',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [{ id: 'med_g1', kind: CardKind.Medicine, color: CardColor.Green }],
    };

    g.public.players[0].board.push(organA);
    g.public.players[1].board.push(organB);

    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: organA.id },
      { playerId: 'p2', organId: organB.id }
    );

    expect(res.success).toBe(true);

    // Después del swap, p1 debe tener el organB con su attached (medicina)
    const newP1Org = g.public.players[0].board.find(o => o.id === 'org_p2_green')!;
    const newP2Org = g.public.players[1].board.find(o => o.id === 'org_p1_red')!;

    expect(newP1Org.attached.find(a => a.id === 'med_g1')).toBeTruthy();
    expect(newP2Org.attached.find(a => a.id === 'virus_r1')).toBeTruthy();

    // Carta usada a descarte
    expect(g.players[0].hand.length).toBe(0);
    expect(g.discard.find(c => c.id === 'treatment_transplant')).toBeTruthy();
  });

  test('permite trasplante con órgano multicolor (no produce duplicados)', () => {
    const g = mkGame(2);

    const organA: OrganOnBoard = {
      id: 'org_p1_multi',
      kind: CardKind.Organ,
      color: CardColor.Multi,
      attached: [],
    };
    const organB: OrganOnBoard = {
      id: 'org_p2_green',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    };

    g.public.players[0].board.push(organA);
    g.public.players[1].board.push(organB);

    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: organA.id },
      { playerId: 'p2', organId: organB.id }
    );

    expect(res.success).toBe(true);
  });

  test('falla si falta targetA o targetB (NO_TARGET)', () => {
    const g = mkGame(2);

    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: '' }, // organId vacío
      { playerId: 'p2', organId: '' }
    );

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.NO_TARGET,
    });
  });

  test('falla si uno de los jugadores destino no existe (INVALID_TARGET)', () => {
    const g = mkGame(2);

    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    // P1 con órgano válido
    const organA: OrganOnBoard = {
      id: 'org_p1_red',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    };
    g.public.players[0].board.push(organA);

    // targetB apunta a jugador que no existe
    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: organA.id },
      { playerId: 'no_such_player', organId: 'fake' }
    );

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.INVALID_TARGET,
    });
  });

  test('falla si el intercambio produce duplicado de color en A (DUPLICATE_ORGAN)', () => {
    const g = mkGame(2);

    const organA: OrganOnBoard = {
      id: 'org_p1_red',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    };
    const organB: OrganOnBoard = {
      id: 'org_p2_green',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    };

    g.public.players[0].board.push(organA, {
      id: 'org_p1_green_dup',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    }); // ya tiene verde → duplicado
    g.public.players[1].board.push(organB);

    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: organA.id },
      { playerId: 'p2', organId: organB.id }
    );

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.DUPLICATE_ORGAN,
    });
  });

  test('intercambia órganos correctamente y cubre el map de ambos lados', () => {
    const g = mkGame(2);

    const organA: OrganOnBoard = {
      id: 'org_p1_red',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    };
    const organB: OrganOnBoard = {
      id: 'org_p2_blue',
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    };

    g.public.players[0].board.push(organA);
    g.public.players[1].board.push(organB);

    g.players[0].hand.push({
      id: 'treatment_transplant',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.Transplant,
    });

    const res = playTransplant(
      g,
      g.players[0],
      0,
      { playerId: 'p1', organId: organA.id },
      { playerId: 'p2', organId: organB.id }
    );

    expect(res.success).toBe(true);

    // Los órganos deben haberse intercambiado
    const newA = g.public.players[0].board.find(o => o.id === organB.id);
    const newB = g.public.players[1].board.find(o => o.id === organA.id);

    expect(newA?.color).toBe(CardColor.Blue);
    expect(newB?.color).toBe(CardColor.Red);

    // Mano vacía tras usar carta
    expect(g.players[0].hand.length).toBe(0);
  });
});
