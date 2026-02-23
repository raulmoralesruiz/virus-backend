import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState, OrganOnBoard, FailedExperimentTarget } from '../../../interfaces/Game.interface.js';
import { playFailedExperiment } from './failed-experiment.service.js';

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

describe('playFailedExperiment', () => {
  test('falla si el órgano objetivo NO está infectado ni vacunado', () => {
    const g = mkGame(2);
    const organ: OrganOnBoard = {
      id: 'org_healthy',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    };
    g.public.players[1].board.push(organ);

    g.players[0].hand.push({
      id: 'card_failed_exp',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.failedExperiment,
    });

    const res = playFailedExperiment(
      g,
      g.players[0],
      0,
      { playerId: 'p2', organId: organ.id, action: 'medicine' } as any 
    );

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.ORGAN_NOT_INFECTED_OR_VACCINATED,
    });
  });

  test('MEDICINA: cura un órgano infectado (elimina virus)', () => {
    const g = mkGame(2);
    const organ: OrganOnBoard = {
      id: 'org_infected',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'virus1', kind: CardKind.Virus, color: CardColor.Red }],
    };
    g.public.players[1].board.push(organ);

    g.players[0].hand.push({
      id: 'card_failed_exp',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.failedExperiment,
    });

    const res = playFailedExperiment(
      g,
      g.players[0],
      0,
      { playerId: 'p2', organId: organ.id, action: 'medicine' } as any
    );

    expect(res.success).toBe(true);
    // Debe haber eliminado el virus
    expect(g.public.players[1].board[0].attached.length).toBe(0);
    // Carta jugada y virus a descarte
    expect(g.discard.length).toBe(2); 
  });

  test('MEDICINA: vacuna un órgano vacunado (lo inmuniza)', () => {
    const g = mkGame(2);
    const organ: OrganOnBoard = {
      id: 'org_vaccinated',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'med1', kind: CardKind.Medicine, color: CardColor.Red }],
    };
    g.public.players[1].board.push(organ);

    g.players[0].hand.push({
      id: 'card_failed_exp',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.failedExperiment,
    });

    const res = playFailedExperiment(
      g,
      g.players[0],
      0,
      { playerId: 'p2', organId: organ.id, action: 'medicine' } as any
    );

    expect(res.success).toBe(true);
    // Debe tener 2 medicinas (inmune)
    expect(g.public.players[1].board[0].attached.length).toBe(2);
    expect(g.public.players[1].board[0].attached[1].kind).toBe(CardKind.Medicine);
  });

  test('VIRUS: elimina medicina de un órgano vacunado', () => {
    const g = mkGame(2);
    const organ: OrganOnBoard = {
      id: 'org_vaccinated',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'med1', kind: CardKind.Medicine, color: CardColor.Red }],
    };
    g.public.players[1].board.push(organ);

    g.players[0].hand.push({
      id: 'card_failed_exp',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.failedExperiment,
    });

    const res = playFailedExperiment(
      g,
      g.players[0],
      0,
      { playerId: 'p2', organId: organ.id, action: 'virus' } as any
    );

    expect(res.success).toBe(true);
    // Debe haber eliminado la medicina
    expect(g.public.players[1].board[0].attached.length).toBe(0);
    expect(g.discard.length).toBe(2);
  });

  test('VIRUS: extirpa un órgano infectado', () => {
    const g = mkGame(2);
    const organ: OrganOnBoard = {
      id: 'org_infected',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [{ id: 'virus1', kind: CardKind.Virus, color: CardColor.Red }],
    };
    g.public.players[1].board.push(organ);

    g.players[0].hand.push({
      id: 'card_failed_exp',
      kind: CardKind.Treatment,
      color: CardColor.Multi,
      subtype: TreatmentSubtype.failedExperiment,
    });

    const res = playFailedExperiment(
      g,
      g.players[0],
      0,
      { playerId: 'p2', organId: organ.id, action: 'virus' } as any
    );

    expect(res.success).toBe(true);
    // El órgano debe haber desaparecido
    expect(g.public.players[1].board.length).toBe(0);
  });

  test('falla si !target, o faltan propiedades', () => {
    const g = mkGame();
    g.players[0].hand.push({ id: 'card', kind: CardKind.Treatment, color: CardColor.Multi, subtype: TreatmentSubtype.failedExperiment });
    const res = playFailedExperiment(g, g.players[0], 0, {} as any);
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.NO_TARGET });
  });

  test('falla si targetPlayer no se encuentra', () => {
    const g = mkGame();
    g.players[0].hand.push({ id: 'card', kind: CardKind.Treatment, color: CardColor.Multi, subtype: TreatmentSubtype.failedExperiment });
    const res = playFailedExperiment(g, g.players[0], 0, { playerId: 'invalid', organId: '1', action: 'medicine' } as any);
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.INVALID_TARGET });
  });

  test('falla si el órgano no se encuentra', () => {
    const g = mkGame();
    g.players[0].hand.push({ id: 'card', kind: CardKind.Treatment, color: CardColor.Multi, subtype: TreatmentSubtype.failedExperiment });
    const res = playFailedExperiment(g, g.players[0], 0, { playerId: 'p2', organId: 'invalid', action: 'medicine' } as any);
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.NO_ORGAN });
  });

  test('restaura carta si medicine falla', () => {
    const g = mkGame();
    const organ: OrganOnBoard = {
      id: 'org1', kind: CardKind.Organ, color: CardColor.Red,
      // INMUNE
      attached: [{ id: 'm1', kind: CardKind.Medicine, color: CardColor.Red }, { id: 'm2', kind: CardKind.Medicine, color: CardColor.Red }],
    };
    g.public.players[1].board.push(organ);
    const card = { id: 'card', kind: CardKind.Treatment, color: CardColor.Multi, subtype: TreatmentSubtype.failedExperiment };
    g.players[0].hand.push(card);
    
    const res = playFailedExperiment(g, g.players[0], 0, { playerId: 'p2', organId: organ.id, action: 'medicine' } as any);
    expect(res.success).toBe(false);
    expect(g.players[0].hand[0].kind).toBe(CardKind.Treatment); // se restauró
  });

  test('restaura carta si virus falla', () => {
    const g = mkGame();
    const organ: OrganOnBoard = {
      id: 'org1', kind: CardKind.Organ, color: CardColor.Red,
      // INMUNE
      attached: [{ id: 'm1', kind: CardKind.Medicine, color: CardColor.Red }, { id: 'm2', kind: CardKind.Medicine, color: CardColor.Red }],
    };
    g.public.players[1].board.push(organ);
    const card = { id: 'card', kind: CardKind.Treatment, color: CardColor.Multi, subtype: TreatmentSubtype.failedExperiment };
    g.players[0].hand.push(card);
    
    const res = playFailedExperiment(g, g.players[0], 0, { playerId: 'p2', organId: organ.id, action: 'virus' } as any);
    expect(res.success).toBe(false);
    expect(g.players[0].hand[0].kind).toBe(CardKind.Treatment); // se restauró
  });

  test('falla si la acción es inválida', () => {
    const g = mkGame();
    const organ: OrganOnBoard = {
      id: 'org1', kind: CardKind.Organ, color: CardColor.Red,
      attached: [{ id: 'v1', kind: CardKind.Virus, color: CardColor.Red }]
    };
    g.public.players[1].board.push(organ);
    g.players[0].hand.push({ id: 'card', kind: CardKind.Treatment, color: CardColor.Multi, subtype: TreatmentSubtype.failedExperiment });
    
    const res = playFailedExperiment(g, g.players[0], 0, { playerId: 'p2', organId: organ.id, action: 'invalid' } as any);
    expect(res).toMatchObject({ success: false, error: GAME_ERRORS.INVALID_ACTION });
  });

  test('restaura la carta y relanza el error si hay una excepción', () => {
    const g = mkGame();
    const organ: OrganOnBoard = {
      id: 'org1', kind: CardKind.Organ, color: CardColor.Red,
      attached: [{ id: 'v1', kind: CardKind.Virus, color: CardColor.Red }]
    };
    g.public.players[1].board.push(organ);
    
    const card = { id: 'card', color: CardColor.Multi, subtype: TreatmentSubtype.failedExperiment } as any;
    let _kind = CardKind.Treatment;
    Object.defineProperty(card, 'kind', {
      get() { return _kind; },
      set(v) { 
        if (v === CardKind.Medicine) throw new Error('Boom'); 
        _kind = v;
      }
    });

    g.players[0].hand.push(card);

    expect(() => {
      playFailedExperiment(g, g.players[0], 0, { playerId: 'p2', organId: organ.id, action: 'medicine' } as any);
    }).toThrow('Boom');
    
    expect(card.color).toBe(CardColor.Multi);
  });
});
