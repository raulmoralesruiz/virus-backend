import { CardKind, CardColor, TreatmentSubtype } from '../../../interfaces/Card.interface.js';
import { GameState, PlayCardTarget, BodySwapTarget } from '../../../interfaces/Game.interface.js';
import { playMedicineCard } from '../medicine-card.service.js';
import { playBodySwap } from './body-swap.service.js';
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
    turnIndex: 0,
    turnStartedAt: Date.now(),
    turnDeadlineTs: Date.now() + 60000,
    history: [],
    lastActionAt: Date.now(),
  };
};
describe('Trick or Treat Interaction with Body Swap', () => {
  test('Cambio de Cuerpo mueve TrucoTrato, y luego jugar medicina debe transferirlo desde el NUEVO dueño', () => {
    const g = mkGame3Players();
    
    // 1. Setup: P1 tiene Truco o Trato
    setTrickOrTreatOwner(g, 'p1');
    expect(getTrickOrTreatOwnerId(g)).toBe('p1');
    expect(g.public.players[0].hasTrickOrTreat).toBe(true);
    expect(g.players[0].hasTrickOrTreat).toBe(true);
    // 2. Setup: P1 juega Cambio de Cuerpo (Clockwise: P1 -> P2, P2 -> P3, P3 -> P1)
    // Espera, BodySwap en sentido horario:
    // "Sentido horario: Yo (i) paso mi cuerpo a (i+1). Por tanto, yo recibo del anterior (i-1)."
    // Si P1 es i=0 (playersCount=3).
    // i=0 recibe de i-1 = -1 -> 2 (P3).
    // i=1 (P2) recibe de i-1 = 0 (P1). -> P2 recibe el cuerpo (y TrucoTrato) de P1.
    // i=2 (P3) recibe de i-1 = 1 (P2).
    // Para hacer que P1 juegue BodySwap:
    g.players[0].hand.push({
      id: 'body_swap_1',
      kind: CardKind.Treatment,
      color: CardColor.Halloween,
      subtype: TreatmentSubtype.BodySwap
    });
    
    const targetSwap: BodySwapTarget = { direction: 'clockwise' };
    playBodySwap(g, g.players[0], 0, targetSwap);
    // Verificación post-swap
    // P2 debería tener el cuerpo de P1, por tanto P2 debería tener TrucoTrato
    expect(g.public.players[1].hasTrickOrTreat).toBe(true);
    expect(g.public.players[0].hasTrickOrTreat).toBe(false);
    // AQUI ESTA EL PROBLEMA: Si playBodySwap no actualiza el estado privado,
    // getTrickOrTreatOwnerId podría devolver 'p1' (incorrecto) o 'p2' (correcto).
    // Si devuelve p1, entonces cuando P2 juegue medicina, fallará la transferencia.
    
    // 3. Setup: P2 (maldito) juega medicina sobre P3
    const organId = 'organ_green_1';
    g.public.players[2].board.push({ // P3 tiene órgano
      id: organId,
      kind: CardKind.Organ,
      color: CardColor.Green,
      attached: [],
    });
    g.players[1].hand.push({ // P2 tiene medicina
      id: 'med_green_1',
      kind: CardKind.Medicine,
      color: CardColor.Green,
    });
    const targetMed: PlayCardTarget = { playerId: 'p3', organId };
    const res = playMedicineCard(g, g.players[1], 0, targetMed);
    expect(res.success).toBe(true);
    // 4. Verificación: Truco o Trato debería haber pasado de P2 a P3
    const currentOwner = getTrickOrTreatOwnerId(g);
    
    // Si el bug existe, currentOwner seguirá siendo P2 (porque nunca se detectó que P2 era el dueño válido para transferir,
    // porque getTrickOrTreatOwnerId pensaba que era P1 quien lo tenía).
    // O tal vez peor, si getTrickOrTreatOwnerId devuelve P1, y P2 juega, no pasa nada.
    
    expect(currentOwner).toBe('p3'); 
  });
});
