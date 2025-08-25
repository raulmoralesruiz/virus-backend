// import { playVirusCard } from './virus-card.service';
// import { GameState, PlayerState } from '../../interfaces/Game.interface';
// import { CardKind, CardColor } from '../../interfaces/Card.interface';
// import { GAME_ERRORS } from '../../constants/error.constants';

// function setupGameWithOrgan(color: CardColor) {
//   const organ = {
//     id: 'o1',
//     kind: CardKind.Organ,
//     color,
//     attached: [],
//   };
//   const ps: PlayerState = {
//     player: { id: 'p1', name: 'Alice' },
//     hand: [{ id: 'v1', kind: CardKind.Virus, color }],
//   };
//   const g: GameState = {
//     public: {
//       roomId: 'r1',
//       startedAt: Date.now(),
//       turnIndex: 0,
//       turnDeadlineTs: Date.now() + 1000,
//       players: [
//         {
//           player: { id: 'p1', name: 'Alice' },
//           board: [organ],
//           handCount: 1,
//         },
//       ],
//     },
//     players: [ps],
//     deck: [],
//     discard: [],
//   };
//   return { g, ps, organ };
// }

// describe('playVirusCard', () => {
//   it('infecta un órgano sin virus', () => {
//     const { g, ps, organ } = setupGameWithOrgan(CardColor.Red);

//     const result = playVirusCard(g, ps, 0, { playerId: 'p1', organId: organ.id });

//     expect(result.success).toBe(true);
//     expect(organ.attached[0].kind).toBe(CardKind.Virus);
//     expect(ps.hand).toHaveLength(0);
//   });

//   it('neutraliza una medicina existente', () => {
//     const { g, ps, organ } = setupGameWithOrgan(CardColor.Red);
//     organ.attached.push({ id: 'm1', kind: CardKind.Medicine, color: CardColor.Red });

//     const result = playVirusCard(g, ps, 0, { playerId: 'p1', organId: organ.id });

//     expect(result.success).toBe(true);
//     expect(organ.attached).toHaveLength(0);
//     expect(g.discard).toHaveLength(2); // virus + medicina
//   });

//   it('extirpa un órgano ya infectado', () => {
//     const { g, ps, organ } = setupGameWithOrgan(CardColor.Red);
//     organ.attached.push({ id: 'v2', kind: CardKind.Virus, color: CardColor.Red });

//     const result = playVirusCard(g, ps, 0, { playerId: 'p1', organId: organ.id });

//     expect(result.success).toBe(true);
//     expect(g.public.players[0].board).toHaveLength(0);
//     expect(g.discard.length).toBeGreaterThan(0);
//   });

//   it('rechaza si el órgano es inmune', () => {
//     const { g, ps, organ } = setupGameWithOrgan(CardColor.Red);
//     organ.attached.push(
//       { id: 'm1', kind: CardKind.Medicine, color: CardColor.Red },
//       { id: 'm2', kind: CardKind.Medicine, color: CardColor.Red }
//     );

//     const result = playVirusCard(g, ps, 0, { playerId: 'p1', organId: organ.id });

//     expect(result.success).toBe(false);
//     expect(result.error).toEqual(GAME_ERRORS.IMMUNE_ORGAN);
//   });
// });
