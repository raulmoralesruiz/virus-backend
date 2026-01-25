
import { drawCardInternal } from './draw-card.service.js';
import { GameState } from '../../interfaces/Game.interface.js';
import { buildDeck } from '../deck.service.js';

const countCards = (g: GameState): number => {
  let total = 0;
  total += g.deck.length;
  total += g.discard.length;
  g.players.forEach(p => total += p.hand.length);
  g.public.players.forEach(p => {
      total += p.board.length; // Organs
      p.board.forEach(organ => total += organ.attached.length); // Attached viruses/medicines
  });
  return total;
};

// Helper: Make a game with a REAL deck
const mkRealGame = (includeHalloween = true): GameState => {
  const deck = buildDeck({ includeHalloweenExpansion: includeHalloween });
  const p1 = { id: 'p1', name: 'P1' };
  const p2 = { id: 'p2', name: 'P2' };

  return {
    roomId: 'conservation-test',
    deck, // 80 cards if halloween
    discard: [],
    players: [
      { player: p1, hand: [], hasTrickOrTreat: false },
      { player: p2, hand: [], hasTrickOrTreat: false },
    ],
    public: {
      players: [
        { player: p1, handCount: 0, board: [], hasTrickOrTreat: false },
        { player: p2, handCount: 0, board: [], hasTrickOrTreat: false },
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

describe('Card Conservation', () => {
    test('Total cards should always be 80 (with Halloween)', () => {
        const g = mkRealGame(true);
        const games = new Map([[g.roomId, g]]);
        const draw = drawCardInternal(games);
        const EXPECTED_TOTAL = 80;

        expect(g.deck.length).toBe(80);
        expect(countCards(g)).toBe(EXPECTED_TOTAL);

        // 1. Deal cards (3 each)
        // Manually drawing to simulate initial deal
        for(let i=0; i<3; i++) {
            draw(g.roomId, 'p1');
            draw(g.roomId, 'p2');
        }

        expect(g.players[0].hand.length).toBe(3);
        expect(g.players[1].hand.length).toBe(3);
        expect(g.deck.length).toBe(80 - 6);
        expect(countCards(g)).toBe(EXPECTED_TOTAL);

        // 2. Simulate play: Move all remaining deck to discard
        // We will move them manually to speed up, leaving just 1 in deck
        while(g.deck.length > 1) {
            const c = g.deck.pop();
            if(c) g.discard.push(c);
        }
        
        expect(g.deck.length).toBe(1);
        expect(countCards(g)).toBe(EXPECTED_TOTAL);
        
        // At this point:
        // Hands: 6
        // Deck: 1
        // Discard: 73
        // Total: 80.
        // Piles (Deck+Discard) = 74.
        expect(g.deck.length + g.discard.length).toBe(74);

        // 3. User draws the last card
        // Before Draw: Deck 1, Discard 73.
        // We need to free up hand space? No, let's say P1 played a card.
        // Simulate P1 playing a card to Board
        const playedCard = g.players[0].hand.pop();
        if(playedCard) {
            g.public.players[0].board.push({ ...playedCard, attached: [] } as any); // Treat as organ for simplicity
        }
        // Check conservation after play
        expect(countCards(g)).toBe(EXPECTED_TOTAL);

        // Now P1 has 2 cards. P1 draws.
        const res1 = draw(g.roomId, 'p1');
        expect(res1.success).toBe(true);

        // After Draw:
        // Deck should be 0.
        // Discard 73.
        // Hand P1: 3.
        // Total Piles: 73. (Deck 0 + Discard 73).
        expect(g.deck.length).toBe(0);
        expect(g.discard.length).toBe(73);
        expect(countCards(g)).toBe(EXPECTED_TOTAL);

        // 4. Next Draw should trigger Recycle
        // P1 plays another card to free space
        const playedCard2 = g.players[0].hand.pop();
        if(playedCard2) {
             g.public.players[0].board.push({ ...playedCard2, attached: [] } as any);
        }
        
        // P1 draws from Empty Deck -> Triggers Recycle
        const res2 = draw(g.roomId, 'p1');
        
        expect(res2.success).toBe(true);
        expect(countCards(g)).toBe(EXPECTED_TOTAL);

        // After Recycle + Draw:
        // Discard should have been recycled.
        // Old Discard was 73.
        // Top kept -> 1 in Discard.
        // 72 shuffled to Deck.
        // Then 1 drawn from Deck.
        // Result: 
        // Discard: 1
        // Deck: 71
        
        expect(g.discard.length).toBe(1);
        expect(g.deck.length).toBe(71);

        // Piles Sum: 72.
        // Board has 2 cards.
        // Hands have 6 cards (P1 3, P2 3).
        // Total = 72 + 2 + 6 = 80.
        expect(g.deck.length + g.discard.length + 8).toBe(80);
    });

    test('Logic when Discard is 72 and Deck is 1 (User Scenario)', () => {
         // User reports: "Tras avance: Mazo 1, Discard 72".
         // This sums to 73.
         // If logic holds, there must be (80-6-73) = 1 card on board.
         const g = mkRealGame(true);
         const games = new Map([[g.roomId, g]]);
         const draw = drawCardInternal(games);

         // Helper to empty deck to specific state
         g.deck = [];
         g.discard = [];
         // Create dummy cards
         // 6 in hands
         // 72 in discard
         // 1 in deck
         // 1 on board
         
         // Fill hands
         for(let i=0; i<3; i++) g.players[0].hand.push({id:'h1_'+i} as any);
         for(let i=0; i<3; i++) g.players[1].hand.push({id:'h2_'+i} as any);

         // Fill deck 1
         g.deck.push({id:'d1'} as any);

         // Fill discard 72
         for(let i=0; i<72; i++) g.discard.push({id:'disc_'+i} as any);

         // Fill board 1
         g.public.players[0].board.push({id:'b1', attached:[]} as any);

         expect(countCards(g)).toBe(80);
         expect(g.deck.length + g.discard.length).toBe(73); // Matches user report

         // User Action: "Recycle" happens eventually.
         // Play 1 card from hand (Hand 2).
         g.players[0].hand.pop();
         g.public.players[0].board.push({id:'b2', attached:[]} as any);
         
         // Draw -> Takes the 1 card from Deck.
         let res = draw(g.roomId, 'p1');
         expect(res.success).toBe(true);
         // Deck 0. Discard 72.
         
         // Next Draw -> Recycles Discard (72 cards).
         // Keep top (1). Move 71 to Deck.
         // Draw 1 from Deck (Deck 70).
         
         // Need space in hand
         g.players[0].hand.pop(); 
         g.public.players[0].board.push({id:'b3', attached:[]} as any);

         res = draw(g.roomId, 'p1');
         expect(res.success).toBe(true);

         // Check counts
         // Discard: 1
         // Deck: 70
         // Total Piles: 71
         
         expect(g.discard.length).toBe(1);
         expect(g.deck.length).toBe(70); 
         expect(countCards(g)).toBe(80);
    });
});
