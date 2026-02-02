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
    history: [],
    lastActionAt: Date.now(),
  };
};

describe('playVirusCard', () => {
  test('falla si no hay objetivos', () => {
    const g = mkGame();
    g.players[0].hand.push({
      id: 'med_green_1',
      kind: CardKind.Medicine,
      color: CardColor.Green,
    });

    const res = playVirusCard(g, g.players[0], 0, undefined);
    expect(res.success).toBe(false);
    expect(res).toMatchObject({ error: GAME_ERRORS.NO_TARGET });
  });

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
      error: {
        code: GAME_ERRORS.COLOR_MISMATCH.code,
        message: 'El Virus Cerebro no puede infectar el Órgano Estómago.',
      },
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

  test('falla al intentar neutralizar una medicina en órgano multicolor si los colores difieren', () => {
    const g = mkGame();

    const organId = 'organ_multi_1';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Multi,
      attached: [{ id: 'med_green_1', kind: CardKind.Medicine, color: CardColor.Green }],
    });

    g.players[0].hand.push({
      id: 'virus_yellow_1',
      kind: CardKind.Virus,
      color: CardColor.Yellow,
    });

    const res = playVirusCard(g, g.players[0], 0, { playerId: 'p2', organId });

    expect(res.success).toBe(false);
    expect(res).toMatchObject({
      error: {
        code: GAME_ERRORS.COLOR_MISMATCH.code,
      },
    });

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(1); // med remains
    expect(g.players[0].hand.length).toBe(1); // card not played
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
      error: {
        code: GAME_ERRORS.IMMUNE_ORGAN.code,
        message: 'El Órgano Hueso es inmune; no puedes infectarlo.',
      },
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

  test('neutraliza si la medicina es Multi y el virus es de un color específico', () => {
    const g = mkGame();
    const organId = 'organ_blue_1';

    // Órgano azul con medicina Multi
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [{ id: 'med_multi', kind: CardKind.Medicine, color: CardColor.Multi }],
    });

    // Mano de P1: virus azul
    g.players[0].hand.push({
      id: 'virus_blue_1',
      kind: CardKind.Virus,
      color: CardColor.Blue,
    });

    const res = playVirusCard(g, g.players[0], 0, { playerId: 'p2', organId });
    expect(res.success).toBe(true);

    // Órgano queda sin medicina
    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(0);

    // Ambos al descarte
    expect(g.discard.find(c => c.id === 'med_multi')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'virus_blue_1')).toBeTruthy();
  });

  test('neutraliza si el virus es Multi y la medicina es de un color específico', () => {
    const g = mkGame();
    const organId = 'organ_green_1';

    // Órgano verde con medicina verde
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [{ id: 'med_green_1', kind: CardKind.Medicine, color: CardColor.Green }],
    });

    // Mano de P1: virus Multi
    g.players[0].hand.push({
      id: 'virus_multi_1',
      kind: CardKind.Virus,
      color: CardColor.Multi,
    });

    const res = playVirusCard(g, g.players[0], 0, { playerId: 'p2', organId });
    expect(res.success).toBe(true);

    const organ = g.public.players[1].board.find(o => o.id === organId)!;
    expect(organ.attached.length).toBe(0);

    // Ambos al descarte
    expect(g.discard.find(c => c.id === 'med_green_1')).toBeTruthy();
    expect(g.discard.find(c => c.id === 'virus_multi_1')).toBeTruthy();
  });

  test('NO_TARGET -> debe fallar si no se pasa target', () => {
    const g = mkGame();
    // poner la carta de virus en la mano del jugador 1
    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    // Llamada sin target
    const res = playVirusCard(g, g.players[0], 0, undefined);
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.NO_TARGET });
  });

  test('INVALID_TARGET -> debe fallar si el player objetivo no existe', () => {
    const g = mkGame();
    // poner la carta de virus en la mano del jugador 1
    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    // target con playerId inexistente
    const res = playVirusCard(g, g.players[0], 0, {
      playerId: 'not-a-player',
      organId: 'whatever',
    });
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.INVALID_TARGET });
  });

  test('NO_ORGAN -> debe fallar si el organId no existe en el tablero del objetivo', () => {
    const g = mkGame();
    // poner la carta de virus en la mano del jugador 1
    g.players[0].hand.push({
      id: 'med_red_1',
      kind: CardKind.Medicine,
      color: CardColor.Red,
    });

    // target válido (p2) pero sin órganos en su board
    const res = playVirusCard(g, g.players[0], 0, { playerId: 'p2', organId: 'nonexistent' });
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.NO_ORGAN });
  });
});
