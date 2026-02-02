import { GAME_ERRORS } from '../../../constants/error.constants.js';
import {
  ApparitionDecision,
  GameState,
  PlayCardResult,
  PlayerState,
} from '../../../interfaces/Game.interface.js';

export const playApparition = (
  g: GameState,
  ps: PlayerState,
  cardIdx: number
): PlayCardResult => {
  // 1. Verificar si hay cartas en el descarte
  if (g.discard.length === 0) {
    return { success: false, error: GAME_ERRORS.EMPTY_DISCARD };
  }

  const card = ps.hand[cardIdx];

  // 2. Extraer la última carta de descartes
  const stolenCard = g.discard.pop();
  if (!stolenCard) {
    // Teóricamente cubierto por check anterior, pero por tipado
    return { success: false, error: GAME_ERRORS.EMPTY_DISCARD };
  }

  // 3. Intercambiar: la carta 'Aparición' va al descarte
  ps.hand.splice(cardIdx, 1); // quitamos aparición de la mano
  
  // OJO: La regla dice "Cambia esta carta por la última...". 
  // Técnicamente la 'Aparición' se juega, va al descarte. 
  // Y la carta robada va a la mano.
  g.discard.push(card); 
  ps.hand.push(stolenCard);

  // 4. Establecer estado de decisión pendiente
  // El usuario DEBE jugar esa carta o pasar turno.
  const decision: ApparitionDecision = {
    type: 'ApparitionDecision',
    playerId: ps.player.id,
    cardId: stolenCard.id,
  };
  g.pendingAction = decision;

  return { success: true };
};
