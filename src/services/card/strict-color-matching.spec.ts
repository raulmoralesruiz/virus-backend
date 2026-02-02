import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardKind, CardColor } from '../../interfaces/Card.interface.js';
import { GameState, PlayCardTarget } from '../../interfaces/Game.interface.js';
import { playMedicineCard } from './medicine-card.service.js';
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

describe('Strict Color Matching on Multi-Color Organs', () => {
    describe('Medicine on Infected Multi-Color Organ', () => {
        test('should FAIL to cure Red Virus with Blue Medicine on Multi Organ', () => {
            const g = mkGame();
            const organId = 'organ_multi_1';
            
            // Setup: P2 has Multi Organ infected with Red Virus
            g.public.players[1].board.push({
                id: organId,
                kind: CardKind.Organ,
                color: CardColor.Multi,
                attached: [{ id: 'virus_red_1', kind: CardKind.Virus, color: CardColor.Red }],
            });

            // P1 plays Blue Medicine
            g.players[0].hand.push({
                id: 'med_blue_1',
                kind: CardKind.Medicine,
                color: CardColor.Blue,
            });

            const target: PlayCardTarget = { playerId: 'p2', organId };
            const res = playMedicineCard(g, g.players[0], 0, target);

            // EXPECTATION: Should FAIL because Blue Medicine cannot cure Red Virus
            if (res.success) {
                fail('Should have failed');
            } else {
                expect(res.error).toEqual(expect.objectContaining({
                    code: GAME_ERRORS.COLOR_MISMATCH.code
                }));
            }
        });

        test('should SUCCESS to cure Red Virus with Red Medicine on Multi Organ', () => {
            const g = mkGame();
            const organId = 'organ_multi_1';
            
            g.public.players[1].board.push({
                id: organId,
                kind: CardKind.Organ,
                color: CardColor.Multi,
                attached: [{ id: 'virus_red_1', kind: CardKind.Virus, color: CardColor.Red }],
            });

            g.players[0].hand.push({
                id: 'med_red_1',
                kind: CardKind.Medicine,
                color: CardColor.Red,
            });

            const target: PlayCardTarget = { playerId: 'p2', organId };
            const res = playMedicineCard(g, g.players[0], 0, target);

            expect(res.success).toBe(true);
        });
    });

    describe('Virus on Vaccinated Multi-Color Organ', () => {
        test('should FAIL to destroy Red Medicine with Blue Virus on Multi Organ', () => {
            const g = mkGame();
            const organId = 'organ_multi_1';
            
            // Setup: P2 has Multi Organ vaccinated with Red Medicine
            g.public.players[1].board.push({
                id: organId,
                kind: CardKind.Organ,
                color: CardColor.Multi,
                attached: [{ id: 'med_red_1', kind: CardKind.Medicine, color: CardColor.Red }],
            });

            // P1 plays Blue Virus
            g.players[0].hand.push({
                id: 'virus_blue_1',
                kind: CardKind.Virus,
                color: CardColor.Blue,
            });

            const target: PlayCardTarget = { playerId: 'p2', organId };
            const res = playVirusCard(g, g.players[0], 0, target);

            // EXPECTATION: Should FAIL because Blue Medicine cannot cure Red Virus
            if (res.success) {
                fail('Should have failed');
            } else {
                expect(res.error).toEqual(expect.objectContaining({
                    code: GAME_ERRORS.COLOR_MISMATCH.code
                }));
            }
        });

        test('should SUCCESS to destroy Red Medicine with Red Virus on Multi Organ', () => {
             const g = mkGame();
            const organId = 'organ_multi_1';
            
            g.public.players[1].board.push({
                id: organId,
                kind: CardKind.Organ,
                color: CardColor.Multi,
                attached: [{ id: 'med_red_1', kind: CardKind.Medicine, color: CardColor.Red }],
            });

            g.players[0].hand.push({
                id: 'virus_red_1',
                kind: CardKind.Virus,
                color: CardColor.Red,
            });

            const target: PlayCardTarget = { playerId: 'p2', organId };
            const res = playVirusCard(g, g.players[0], 0, target);

            expect(res.success).toBe(true);
        });
    });
});
