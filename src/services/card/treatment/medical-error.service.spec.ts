import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState } from '../../../interfaces/Game.interface.js';
import { setTrickOrTreatOwner } from '../../../utils/trick-or-treat.utils.js';
import { playMedicalError } from './medical-error.service.js';

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

describe('playMedicalError', () => {
  test('intercambia los cuerpos completos entre dos jugadores', () => {
    const g = mkGame();

    // P1 tiene un órgano rojo
    g.public.players[0].board.push({
      id: 'organ_red',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    });

    // P2 tiene un órgano verde
    g.public.players[1].board.push({
      id: 'organ_green',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    // P1 juega Medical Error
    g.players[0].hand.push({
      id: 'med_error_1',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.MedicalError,
    });

    const res = playMedicalError(g, g.players[0], 0, { playerId: 'p2' });
    expect(res.success).toBe(true);

    // Se intercambiaron los cuerpos
    expect(g.public.players[0].board.some(o => o.color === CardColor.Green)).toBe(true);
    expect(g.public.players[1].board.some(o => o.color === CardColor.Red)).toBe(true);

    // La carta se descarta
    expect(g.discard.find(c => c.id === 'med_error_1')).toBeTruthy();
    expect(g.players[0].hand.length).toBe(0);
  });

  test('falla si no se pasa un objetivo', () => {
    const g = mkGame();
    g.players[0].hand.push({
      id: 'med_error_2',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.MedicalError,
    });

    const res = playMedicalError(g, g.players[0], 0, undefined as any);
    expect(res.success).toBe(false);
    expect(res).toMatchObject({ error: GAME_ERRORS.NO_TARGET });
  });

  test('falla si el jugador objetivo no existe', () => {
    const g = mkGame();
    g.players[0].hand.push({
      id: 'med_error_3',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.MedicalError,
    });

    const res = playMedicalError(g, g.players[0], 0, { playerId: 'fake' });
    expect(res.success).toBe(false);
    expect(res).toMatchObject({ error: GAME_ERRORS.INVALID_TARGET });
  });

  test('funciona aunque uno de los jugadores no tenga órganos', () => {
    const g = mkGame();

    // P1 tiene órgano azul
    g.public.players[0].board.push({
      id: 'organ_blue',
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    });

    // P2 no tiene órganos
    g.public.players[1].board = [];

    g.players[0].hand.push({
      id: 'med_error_4',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.MedicalError,
    });

    const res = playMedicalError(g, g.players[0], 0, { playerId: 'p2' });
    expect(res.success).toBe(true);

    // Ahora P2 debería tener el órgano azul
    expect(g.public.players[1].board.some(o => o.color === CardColor.Blue)).toBe(true);
    // P1 debería quedarse vacío
    expect(g.public.players[0].board.length).toBe(0);
  });

  test('transfiere Truco o Trato del objetivo al jugador activo junto con el cuerpo', () => {
    const g = mkGame();

    g.public.players[0].board.push({
      id: 'organ_blue',
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    });
    g.public.players[1].board.push({
      id: 'organ_green',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    setTrickOrTreatOwner(g, 'p2');

    g.players[0].hand.push({
      id: 'med_error_5',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.MedicalError,
    });

    const res = playMedicalError(g, g.players[0], 0, { playerId: 'p2' });
    expect(res.success).toBe(true);

    expect(g.public.players[0].hasTrickOrTreat).toBe(true);
    expect(g.public.players[1].hasTrickOrTreat).toBe(false);
    expect(g.history[0]).toBe('Truco o Trato pasa a P1');
  });

  test('transfiere Truco o Trato del jugador activo al objetivo junto con el cuerpo', () => {
    const g = mkGame();

    g.public.players[0].board.push({
      id: 'organ_blue',
      kind: CardKind.Organ,
      color: CardColor.Blue,
      attached: [],
    });
    g.public.players[1].board.push({
      id: 'organ_green',
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });

    setTrickOrTreatOwner(g, 'p1');

    g.players[0].hand.push({
      id: 'med_error_6',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.MedicalError,
    });

    const res = playMedicalError(g, g.players[0], 0, { playerId: 'p2' });
    expect(res.success).toBe(true);

    expect(g.public.players[0].hasTrickOrTreat).toBe(false);
    expect(g.public.players[1].hasTrickOrTreat).toBe(true);
    expect(g.history[0]).toBe('Truco o Trato pasa a P2');
  });
});
