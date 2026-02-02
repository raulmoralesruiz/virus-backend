import { CardKind, CardColor } from '../../../interfaces/Card.interface.js';
import { GameState, PlayCardTarget } from '../../../interfaces/Game.interface.js';
import { playMedicineCard } from '../medicine-card.service.js';
import { getTrickOrTreatOwnerId, setTrickOrTreatOwner } from '../../../utils/trick-or-treat.utils.js';
const mkGame3Players = (): GameState => {
  const p1 = { id: 'p1', name: 'P1' };
  const p2 = { id: 'p2', name: 'P2' };
  const p3 = { id: 'p3', name: 'P3' };
  return {
    roomId: 'r1',
    deck: [],
    discard: [],
    players: [
      { player: p1, hand: [] },
      { player: p2, hand: [] },
      { player: p3, hand: [] },
    ],
    public: {
      players: [
        { player: p1, handCount: 0, board: [] },
        { player: p2, handCount: 0, board: [] },
        { player: p3, handCount: 0, board: [] },
      ],
    },
    startedAt: new Date().toISOString(),
    turnIndex: 1, // Turno de P2
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60000,
    history: [],
    lastActionAt: Date.now(),
  };
};
describe('Trick or Treat Bug Reproduction', () => {
  test('P2 tiene TrucoTrato -> P2 juega medicina sobre P3 -> TrucoTrato pasa a P3', () => {
    const g = mkGame3Players();
    
    // 1. Setup: P2 tiene Truco o Trato
    setTrickOrTreatOwner(g, 'p2');
    expect(getTrickOrTreatOwnerId(g)).toBe('p2');
    expect(g.players[1].hasTrickOrTreat).toBe(true);
    // 2. Setup: P3 tiene un órgano donde jugar medicina
    const organId = 'organ_green_1';
    g.public.players[2].board.push({
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });
    // 3. Setup: P2 tiene medicina verde
    g.players[1].hand.push({
      id: 'med_green_1',
      kind: CardKind.Medicine,
      color: CardColor.Green,
    });
    // 4. Acción: P2 juega medicina sobre P3
    const target: PlayCardTarget = { playerId: 'p3', organId };
    const res = playMedicineCard(g, g.players[1], 0, target);
    expect(res.success).toBe(true);
    // 5. Verificación: Truco o Trato debe haber pasado a P3
    const newOwnerId = getTrickOrTreatOwnerId(g);
    expect(newOwnerId).toBe('p3');
    expect(g.players[1].hasTrickOrTreat).toBe(false);
    expect(g.players[2].hasTrickOrTreat).toBe(true);
  });
});
