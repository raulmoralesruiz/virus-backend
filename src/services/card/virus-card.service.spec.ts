import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardKind, CardColor } from '../../interfaces/Card.interface.js';
import { GameState, PlayCardTarget } from '../../interfaces/Game.interface.js';
import { playVirusCard } from './virus-card.service.js';

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

describe('playVirusCard', () => {
  test('infecta un órgano libre', () => {
    const g = mkGame();
    const organId = 'organ_green_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [], // libre
    });
    g.players[0].hand.push({
      id: 'virus_green_1',
      kind: CardKind.Virus,
      color: CardColor.Green,
    });

    const res = playVirusCard(g, g.players[0], 0, { playerId: 'p2', organId });
    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.some(a => a.kind === CardKind.Virus)).toBe(true);
    expect(g.players[0].hand.length).toBe(0);
  });

  test('falla si el color no coincide', () => {
    const g = mkGame();
    const organId = 'organ_green_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [], // libre
    });
    g.players[0].hand.push({
      id: 'virus_blue_1',
      kind: CardKind.Virus,
      color: CardColor.Blue,
    });

    const res = playVirusCard(g, g.players[0], 0, { playerId: 'p2', organId });
    expect(res.success).toBe(false);

    // Comprobar que devuelve el error correcto
    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.COLOR_MISMATCH,
    });

    // La carta sigue en mano porque no se jugó
    expect(g.players[0].hand.length).toBe(1);
  });

  test('extirpa un órgano ya infectado', () => {
    const g = mkGame();

    // Estado: p2 tiene un organo rojo con virus rojo
    const organId = 'organ_red_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'virus_red_1', kind: CardKind.Virus, color: CardColor.Red }],
    });

    // Mano de p1: un virus rojo
    g.players[0].hand.push({
      id: 'virus_red_2',
      kind: CardKind.Virus,
      color: CardColor.Red,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };

    const res = playVirusCard(g, g.players[0], 0, target);
    expect(res.success).toBe(true);

    // El órgano debería desaparecer del tablero de P2
    expect(g.public.players[1].board).toHaveLength(0);

    // Órgano y ambos Virus al descarte
    expect(g.discard.find(c => c.id === 'virus_red_1')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'virus_red_2')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'organ_red_1')).toBeTruthy();

    // Carta gastada de la mano
    expect(g.players[0].hand.length).toBe(0);
  });

  test('neutraliza una medicina del mismo color', () => {
    const g = mkGame();

    // Estado: p1 juega virus rojo a órgano rojo de p2 con medicina roja
    const organId = 'organ_red_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'med_red_1', kind: CardKind.Medicine, color: CardColor.Red }],
    });

    // Mano de p1: un virus rojo
    g.players[0].hand.push({
      id: 'virus_red_1',
      kind: CardKind.Virus,
      color: CardColor.Red,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playVirusCard(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    // La medicina debería desaparecer del órgano
    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(0);

    // Virus y medicina al descarte
    expect(g.discard.find(c => c.id === 'med_red_1')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'virus_red_1')).toBeTruthy();

    // Carta gastada de la mano
    expect(g.players[0].hand.length).toBe(0);
  });

  test('falla en órgano inmune', () => {
    const g = mkGame();
    const organId = 'organ_yellow_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Yellow,
      attached: [
        { id: 'med_yellow_a', kind: CardKind.Medicine, color: CardColor.Yellow },
        { id: 'med_yellow_b', kind: CardKind.Medicine, color: CardColor.Yellow },
      ], // 2 medicinas → inmune
    });
    g.players[0].hand.push({
      id: 'virus_yellow_1',
      kind: CardKind.Virus,
      color: CardColor.Yellow,
    });

    const res = playVirusCard(g, g.players[0], 0, { playerId: 'p2', organId });
    expect(res.success).toBe(false);

    // Comprobar que devuelve el error correcto
    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.IMMUNE_ORGAN,
    });

    // La carta sigue en mano porque no se jugó
    expect(g.players[0].hand.length).toBe(1);
  });

  test('virus multicolor puede infectar órgano de cualquier color', () => {
    const g = mkGame();
    const organId = 'organ_red_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'virus_multi_1',
      kind: CardKind.Virus,
      color: CardColor.Multi,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playVirusCard(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.some(a => a.kind === CardKind.Virus)).toBe(true);
  });

  test('virus normal puede infectar órgano multicolor', () => {
    const g = mkGame();
    const organId = 'organ_multi_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Multi,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'virus_green_1',
      kind: CardKind.Virus,
      color: CardColor.Green,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playVirusCard(g, g.players[0], 0, target);

    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.some(a => a.kind === CardKind.Virus)).toBe(true);
  });
});
