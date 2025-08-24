import { GAME_ERRORS } from '../../constants/error.constants.js';
import { CardColor, CardKind, Card } from '../../interfaces/Card.interface.js';
import { PlayCardResult, PlayCardTarget, GameState } from '../../interfaces/Game.interface.js';
import { playOrganCard } from './organ-card.service.js';
import { playVirusCard } from './virus-card.service.js';

export const playCardInternal =
  (games: Map<string, GameState>) =>
  (roomId: string, playerId: string, cardId: string, target?: PlayCardTarget): PlayCardResult => {
    const g = games.get(roomId);
    if (!g) return { success: false, error: GAME_ERRORS.NO_GAME };

    const ps = g.players.find(p => p.player.id === playerId);
    if (!ps) return { success: false, error: GAME_ERRORS.NO_PLAYER };

    const cardIdx = ps.hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return { success: false, error: GAME_ERRORS.NO_CARD };

    const card = ps.hand[cardIdx];

    if (card.kind === CardKind.Organ) {
      return playOrganCard(g, ps, cardIdx);
    }
    if (card.kind === CardKind.Virus) {
      return playVirusCard(g, ps, cardIdx, target);
    }

    return { success: false, error: GAME_ERRORS.UNSUPPORTED_CARD };
  };
