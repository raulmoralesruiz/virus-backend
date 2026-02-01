import { GameState, PlayCardResult, BodySwapTarget } from '../../../interfaces/Game.interface.js';
import { PlayerState, PublicPlayerInfo } from '../../../interfaces/Game.interface.js';
import { GAME_ERRORS } from '../../../constants/error.constants.js';
import { pushHistoryEntry } from '../../../utils/history.utils.js';
import { OrganOnBoard } from '../../../interfaces/Game.interface.js';

export const playBodySwap = (
  game: GameState,
  playerState: PlayerState,
  cardIndex: number,
  target: BodySwapTarget
): PlayCardResult => {
  if (target.direction !== 'clockwise' && target.direction !== 'counter-clockwise') {
    return { success: false, error: GAME_ERRORS.INVALID_TARGET };
  }

  // Descartar la carta jugada
  const [playedCard] = playerState.hand.splice(cardIndex, 1);
  game.discard.push(playedCard);

  const playersCount = game.public.players.length;
  if (playersCount < 2) {
      // No hay a quien cambiar, pero se gasta la carta
       pushHistoryEntry(
        game,
        `${playerState.player.name} usó Cambio de Cuerpos, pero está solo... ¡Qué triste!`
      );
      return { success: true };
  }

  // Copia de los tableros y estados actuales
  const currentBoards = game.public.players.map((p: PublicPlayerInfo) => ({
    board: p.board,
    hasTrickOrTreat: p.hasTrickOrTreat
  }));
  
  const newStates: { board: OrganOnBoard[], hasTrickOrTreat?: boolean }[] = new Array(playersCount);

  for (let i = 0; i < playersCount; i++) {
    let sourceIndex: number;

    if (target.direction === 'clockwise') {
      // Sentido horario: Yo (i) paso mi cuerpo a (i+1).
      // Por tanto, yo recibo del anterior (i-1).
      sourceIndex = (i - 1 + playersCount) % playersCount;
    } else {
      // Sentido antihorario: Yo (i) paso mi cuerpo a (i-1).
      // Por tanto, yo recibo del siguiente (i+1).
      sourceIndex = (i + 1) % playersCount;
    }

    newStates[i] = currentBoards[sourceIndex];
  }

  // Aplicar cambios
  game.public.players.forEach((p: PublicPlayerInfo, index: number) => {
    p.board = newStates[index].board;
    p.hasTrickOrTreat = newStates[index].hasTrickOrTreat;

    // Sync private state
    const ps = game.players.find(x => x.player.id === p.player.id);
    if (ps) {
      ps.hasTrickOrTreat = p.hasTrickOrTreat;
    }
  });

  // const directionText = target.direction === 'clockwise' ? 'horario' : 'antihorario';
  // pushHistoryEntry(
  //   game,
  //   `¡${playerState.player.name} provocó un Cambio de Cuerpos en sentido ${directionText}!`
  // );

  return { success: true };
};
