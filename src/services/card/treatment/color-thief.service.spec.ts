import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState, PlayCardTarget } from '../../../interfaces/Game.interface.js';
import { playColorThief } from './color-thief.service.js';

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

describe('playColorThief', () => {
  test('roba un órgano sano del color correcto', () => {
    const g = mkGame();
    const organId = 'organ_green';
    // P2 tiene un órgano verde
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    // P1 tiene la carta Ladrón de Color (Verde)
    g.players[0].hand.push({
      id: 'color_thief_green',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.ColorThiefGreen,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playColorThief(g, g.players[0], 0, target, CardColor.Green);

    expect(res.success).toBe(true);

    // Órgano movido de P2 a P1
    expect(g.public.players[1].board).toHaveLength(0);
    expect(g.public.players[0].board[0].id).toBe(organId);
    // Carta descartada
    expect(g.players[0].hand.length).toBe(0);
    expect(g.discard.find(c => c.id === 'color_thief_green')).toBeTruthy();
  });

  test('falla si el color del órgano no coincide con el objetivo del ladrón', () => {
    const g = mkGame();
    const organId = 'organ_red';
    // P2 tiene un órgano ROJO
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    });

    // P1 intenta robar con Ladrón VERDE
    g.players[0].hand.push({
      id: 'color_thief_green',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.ColorThiefGreen,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    // Llamamos con CardColor.Green porque es el efecto de la carta
    const res = playColorThief(g, g.players[0], 0, target, CardColor.Green);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.INVALID_TARGET,
    });
    
    // Nadie movió nada
    expect(g.public.players[1].board).toHaveLength(1);
    expect(g.public.players[0].board).toHaveLength(0);
  });

  test('PUEDE robar un órgano inmune (2 medicinas)', () => {
    const g = mkGame();
    const organId = 'organ_yellow';
    // P2 tiene órgano amarillo INMUNIZADO
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Yellow,
      attached: [
        { id: 'med1', kind: CardKind.Medicine, color: CardColor.Yellow },
        { id: 'med2', kind: CardKind.Medicine, color: CardColor.Yellow },
      ],
    });

    // P1 tiene Ladrón Amarillo
    g.players[0].hand.push({
      id: 'color_thief_yellow',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.ColorThiefYellow,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playColorThief(g, g.players[0], 0, target, CardColor.Yellow);

    // DEBE tener éxito (diferencia con Ladrón de Órganos normal)
    expect(res.success).toBe(true);

    expect(g.public.players[1].board).toHaveLength(0);
    expect(g.public.players[0].board[0].id).toBe(organId);
    // Conserva las medicinas
    expect(g.public.players[0].board[0].attached).toHaveLength(2);
  });

  test('falla si el jugador ya tiene un órgano del mismo color', () => {
    const g = mkGame();
    // P1 ya tiene órgano azul
    g.public.players[0].board.push({
      id: 'organ_blue_p1',
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    });

    // P2 tiene órgano azul
    const organId = 'organ_blue_p2';
    g.public.players[1].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    });

    g.players[0].hand.push({
      id: 'color_thief_blue',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.ColorThiefBlue,
    });

    const target: PlayCardTarget = { playerId: 'p2', organId };
    const res = playColorThief(g, g.players[0], 0, target, CardColor.Blue);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.DUPLICATE_ORGAN,
    });
  });
});
