import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState, PlayCardTarget } from '../../../interfaces/Game.interface.js';
import { playOrganThief } from './organ-thief.service.js';

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
  };
};

describe('playOrganThief', () => {
  test('roba un órgano sano correctamente', () => {
    const g = mkGame();

    const organId = 'organ_green';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playOrganThief(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    // Órgano movido de P2 a P1
    expect(g.public.players[1].board).toHaveLength(0);
    expect(g.public.players[0].board[0].id).toBe(organId);

    // Carta descartada
    expect(g.players[0].hand.length).toBe(0);
    expect(g.discard.find(c => c.id === 'organ_thief')).toBeTruthy();
  });

  test('falla si el órgano está inmune (2 medicinas)', () => {
    const g = mkGame();
    const organId = 'organ_yellow';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Yellow,
      attached: [
        { id: 'med1', kind: CardKind.Medicine, color: CardColor.Yellow },
        { id: 'med2', kind: CardKind.Medicine, color: CardColor.Yellow },
      ],
    });

    g.players[0].hand.push({
      id: 'organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playOrganThief(g, g.players[0], 0, target);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.IMMUNE_ORGAN,
    });

    // Carta sigue en la mano
    expect(g.players[0].hand.length).toBe(1);
  });

  test('falla si el jugador ya tiene un órgano del mismo color', () => {
    const g = mkGame();

    // P1 ya tiene órgano verde
    g.public.players[0].board.push({
      id: 'organ_green_p1',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    // P2 tiene órgano verde
    const organId = 'organ_green_p2';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playOrganThief(g, g.players[0], 0, target);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.DUPLICATE_ORGAN,
    });

    expect(g.players[0].hand.length).toBe(1);
    expect(g.public.players[1].board.length).toBe(1);
  });

  test('roba un órgano infectado con virus', () => {
    const g = mkGame();

    const organId = 'organ_blue_p2';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [{ id: 'virus_blue_1', kind: CardKind.Virus, color: CardColor.Blue }],
    });

    g.players[0].hand.push({
      id: 'organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playOrganThief(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    // Órgano con virus ahora en P1
    const organ = g.public.players[0].board.find(o => o.id === organId);
    expect(organ).toBeTruthy();
    expect(organ!.attached.some(a => a.kind === CardKind.Virus)).toBe(true);

    // P2 sin órgano
    expect(g.public.players[1].board).toHaveLength(0);
  });

  test('puede robar un órgano multicolor', () => {
    const g = mkGame();

    const organId = 'organ_multi_p2';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Multi, // órgano multicolor
      attached: [],
    });

    g.players[0].hand.push({
      id: 'organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playOrganThief(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    // Órgano robado con éxito
    expect(g.public.players[0].board[0].id).toBe(organId);
    expect(g.public.players[1].board).toHaveLength(0);

    // Carta descartada
    expect(g.discard.find(c => c.id === 'organ_thief')).toBeTruthy();
  });

  test('puede robar un órgano vacunado (1 medicina)', () => {
    const g = mkGame();

    const organId = 'organ_yellow_vac';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Yellow,
      attached: [{ id: 'med_yellow_1', kind: CardKind.Medicine, color: CardColor.Yellow }],
    });

    g.players[0].hand.push({
      id: 'organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playOrganThief(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    // Órgano vacunado pasa completo con medicina incluida
    const organ = g.public.players[0].board.find(o => o.id === organId);
    expect(organ).toBeTruthy();
    expect(organ!.attached.some(a => a.kind === CardKind.Medicine)).toBe(true);

    // P2 sin órgano
    expect(g.public.players[1].board).toHaveLength(0);
  });

  test('falla si intento robar un órgano y ya tengo multicolor propio', () => {
    const g = mkGame();

    // P1 ya tiene órgano multicolor
    g.public.players[0].board.push({
      id: 'organ_multi_p1',
      kind: CardKind.Organ,
      color: CardColor.Multi,
      attached: [],
    });

    // P2 tiene otro multicolor
    const organId = 'organ_multi_p2';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Multi,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playOrganThief(g, g.players[0], 0, target);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.DUPLICATE_ORGAN,
    });

    // Mano sigue igual
    expect(g.players[0].hand.length).toBe(1);
    // Órgano sigue en P2
    expect(g.public.players[1].board).toHaveLength(1);
  });

  test('NO_TARGET -> debe fallar si no se pasa target', () => {
    const g = mkGame();
    // poner la carta de Ladrón de órganos en la mano del jugador 1
    g.players[0].hand.push({
      id: 't_organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    // Llamada sin target
    const res = playOrganThief(g, g.players[0], 0, undefined as any);
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.NO_TARGET });

    // también prueba con target sin organId
    const res2 = playOrganThief(g, g.players[0], 0, {
      playerId: 'p2',
      organId: '',
    } as PlayCardTarget);
    expect(res2).toMatchObject({ success: false, error: GAME_ERRORS.NO_TARGET });
  });

  test('INVALID_TARGET -> debe fallar si el player objetivo no existe', () => {
    const g = mkGame();
    // carta en mano
    g.players[0].hand.push({
      id: 't_organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    // target con playerId inexistente
    const res = playOrganThief(g, g.players[0], 0, {
      playerId: 'not-a-player',
      organId: 'whatever',
    });
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.INVALID_TARGET });
  });

  test('NO_ORGAN -> debe fallar si el organId no existe en el tablero del objetivo', () => {
    const g = mkGame();
    // carta en mano
    g.players[0].hand.push({
      id: 't_organ_thief',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.OrganThief,
    });

    // target válido (p2) pero sin órganos en su board
    const res = playOrganThief(g, g.players[0], 0, { playerId: 'p2', organId: 'nonexistent' });
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.NO_ORGAN });
  });
});
