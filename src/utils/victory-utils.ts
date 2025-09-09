import { CardKind, CardColor } from '../interfaces/Card.interface.js';
import { GameState, PublicPlayerInfo } from '../interfaces/Game.interface.js';
import { isInfected, isOrgan } from './organ-utils.js';

// Jugador que cumple tener 4 órganos diferentes sanos
export const checkVictory = (g: GameState): PublicPlayerInfo | null => {
  for (const p of g.public.players) {
    const distinctColors = new Set<CardColor>();

    for (const organ of p.board) {
      if (isOrgan(organ) && !isInfected(organ)) {
        distinctColors.add(organ.color);
      }
    }

    if (distinctColors.size >= 4) {
      return p;
    }
  }

  return null;
};
