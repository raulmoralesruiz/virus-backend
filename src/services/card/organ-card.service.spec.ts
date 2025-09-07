import { playOrganCard } from './organ-card.service.js';
import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardKind, CardColor } from '../../interfaces/Card.interface.js';
import { GameState, OrganOnBoard } from '../../interfaces/Game.interface.js';

const mkGame = (): GameState => {
  const p1 = { id: 'p1', name: 'P1' };
  return {
    roomId: 'r1',
    deck: [],
    discard: [],
    players: [{ player: p1, hand: [] }],
    public: {
      players: [{ player: p1, handCount: 0, board: [] }],
    },
    startedAt: new Date().toISOString(),
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60000,
  };
};

describe('playOrganCard', () => {
  test('coloca un órgano correctamente en el tablero', () => {
    const g = mkGame();
    g.players[0].hand.push({
      id: 'org_green_1',
      kind: CardKind.Organ,
      color: CardColor.Green,
    });

    const res = playOrganCard(g, g.players[0], 0);
    expect(res.success).toBe(true);

    // Mano vacía tras jugar
    expect(g.players[0].hand.length).toBe(0);

    // Órgano añadido al tablero público
    const organ = g.public.players[0].board.find(o => o.id === 'org_green_1');
    expect(organ).toBeTruthy();
    expect(organ?.color).toBe(CardColor.Green);

    // HandCount actualizado
    expect(g.public.players[0].handCount).toBe(0);
  });

  test('falla si el jugador no existe en estado público', () => {
    const g = mkGame();
    g.public.players = []; // borramos estado público

    g.players[0].hand.push({
      id: 'org_red_1',
      kind: CardKind.Organ,
      color: CardColor.Red,
    });

    const res = playOrganCard(g, g.players[0], 0);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.PUBLIC_MISSING,
    });

    // La carta sigue en la mano
    expect(g.players[0].hand.length).toBe(1);
  });

  test('falla si intenta jugar un órgano duplicado del mismo color', () => {
    const g = mkGame();

    // Estado: ya tiene un órgano rojo en mesa
    const organRed: OrganOnBoard = {
      id: 'org_red_old',
      kind: CardKind.Organ,
      color: CardColor.Red,
      attached: [],
    };
    g.public.players[0].board.push(organRed);

    // Mano con otro órgano rojo
    g.players[0].hand.push({
      id: 'org_red_new',
      kind: CardKind.Organ,
      color: CardColor.Red,
    });

    const res = playOrganCard(g, g.players[0], 0);

    expect(res).toMatchObject({
      success: false,
      error: GAME_ERRORS.DUPLICATE_ORGAN,
    });

    // Carta sigue en mano
    expect(g.players[0].hand.length).toBe(1);
  });

  test('actualiza correctamente handCount al jugar un órgano', () => {
    const g = mkGame();

    g.players[0].hand.push(
      { id: 'org_blue_1', kind: CardKind.Organ, color: CardColor.Blue },
      { id: 'org_yellow_1', kind: CardKind.Organ, color: CardColor.Yellow }
    );

    const res = playOrganCard(g, g.players[0], 0);
    expect(res.success).toBe(true);

    // Mano con 1 carta después
    expect(g.players[0].hand.length).toBe(1);
    expect(g.public.players[0].handCount).toBe(1);
  });
});
