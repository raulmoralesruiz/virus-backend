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
});
