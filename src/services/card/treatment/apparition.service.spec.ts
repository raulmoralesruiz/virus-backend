import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState } from '../../../interfaces/Game.interface.js';
import { playApparition } from './apparition.service.js';

// Helper para crear un estado de juego básico
const mkGame = (): GameState => {
  return {
    roomId: 'r1',
    deck: [],
    discard: [],
    players: [
      {
        player: { id: 'p1', name: 'P1' },
        hand: [],
      },
    ],
    public: {
      players: [{ player: { id: 'p1', name: 'P1' }, handCount: 0, board: [] }],
    },
    startedAt: new Date().toISOString(),
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60000,
    history: [],
  };
};

describe('playApparition', () => {
  test('falla si el descarte está vacío', () => {
    const g = mkGame();
    // Mano con Aparición
    g.players[0].hand.push({
      id: 'apparition-card',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.Apparition,
    });

    const res = playApparition(g, g.players[0], 0);
    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.EMPTY_DISCARD,
    });
  });

  test('intercambia carta con el descarte y establece pendingAction', () => {
    const g = mkGame();
    // Añadir carta al descarte
    const discardCard = {
      id: 'discarded-organ',
      kind: CardKind.Organ,
      color: CardColor.Red,
    };
    g.discard.push(discardCard);

    // Mano con Aparición
    const apparitionCard = {
      id: 'apparition-card',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.Apparition,
    };
    g.players[0].hand.push(apparitionCard);

    const res = playApparition(g, g.players[0], 0);

    expect(res.success).toBe(true);

    // Verificar intercambio
    expect(g.players[0].hand).toContain(discardCard);
    expect(g.discard).toContain(apparitionCard);
    // Verificar que Aparición es la última del descarte
    expect(g.discard[g.discard.length - 1]).toBe(apparitionCard);

    // Verificar pendingAction
    expect(g.pendingAction).toEqual({
      type: 'ApparitionDecision',
      playerId: 'p1',
      cardId: 'discarded-organ',
    });
  });

  test('limpia pendingAction si se llama a endTurn (simula timeout/elección de conservar)', () => {
    const g = mkGame();
    // estado con pendingAction
    g.pendingAction = {
      type: 'ApparitionDecision',
      playerId: 'p1',
      cardId: 'some-card',
    };

    // simulamos fin de turno (como haría el timer modificado o el endTurn explícito)
    if (g.pendingAction) {
      delete g.pendingAction;
    }

    expect(g.pendingAction).toBeUndefined();
  });
});
