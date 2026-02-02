export interface GameError {
  code: string;
  message: string;
}

export const GAME_ERRORS = {
  NO_PLAYER: {
    code: 'NO_PLAYER',
    message: 'Jugador no identificado',
  },
  NOT_HOST: {
    code: 'NOT_HOST',
    message: 'Solo el host puede reiniciar la partida',
  },
  NUMBER_PLAYERS: {
    code: 'NUMBER_PLAYERS',
    message: 'Número de jugadores incorrecto',
  },
  PLAYER_NOT_IDENTIFIED: {
    code: 'PLAYER_NOT_IDENTIFIED',
    message: 'Jugador no identificado',
  },
  ROOM_NOT_FOUND: {
    code: 'ROOM_NOT_FOUND',
    message: 'Sala no existe',
  },
  NO_ROOM: {
    code: 'NO_ROOM',
    message: 'Sala no existe',
  },
  NOT_IN_ROOM: {
    code: 'NOT_IN_ROOM',
    message: 'No perteneces a esta sala',
  },
  GAME_NOT_FOUND: {
    code: 'GAME_NOT_FOUND',
    message: 'Partida no encontrada',
  },
  NO_GAME: {
    code: 'NO_GAME',
    message: 'Partida no encontrada',
  },
  NOT_YOUR_TURN: {
    code: 'NOT_YOUR_TURN',
    message: 'No es tu turno',
  },
  NO_CARDS_LEFT: {
    code: 'NO_CARDS_LEFT',
    message: 'No hay cartas para robar',
  },
  NO_CARD: {
    code: 'NO_CARD',
    message: 'No tienes esa carta en mano',
  },
  PUBLIC_MISSING: {
    code: 'PUBLIC_MISSING',
    message: 'Estado público no encontrado',
  },
  DUPLICATE_ORGAN: {
    code: 'DUPLICATE_ORGAN',
    message: 'Ya tienes un órgano de ese color',
  },
  NO_TARGET: {
    code: 'NO_TARGET',
    message: 'Debes seleccionar un órgano a infectar',
  },
  INVALID_TARGET: {
    code: 'INVALID_TARGET',
    message: 'Objetivo inválido',
  },
  NO_ORGAN: {
    code: 'NO_ORGAN',
    message: 'Órgano no encontrado',
  },
  COLOR_MISMATCH: {
    code: 'COLOR_MISMATCH',
    message: 'La carta no coincide con el color del órgano',
  },
  UNSUPPORTED_CARD: {
    code: 'UNSUPPORTED_CARD',
    message: 'Tipo de carta no soportado aún',
  },
  UNSUPPORTED_TREATMENT: {
    code: 'UNSUPPORTED_TREATMENT',
    message: 'Tipo de tratamiento no soportado aún',
  },
  EMPTY_DISCARD: {
    code: 'EMPTY_DISCARD',
    message: 'El mazo de descartes está vacío',
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Error interno',
  },
  ALREADY_IMMUNE: {
    code: 'ALREADY_IMMUNE',
    message: 'El órgano ya está inmune',
  },
  IMMUNE_ORGAN: {
    code: 'IMMUNE_ORGAN',
    message: 'El órgano es inmune',
  },
  HAND_LIMIT_REACHED: {
    code: 'HAND_LIMIT_REACHED',
    message: 'Has alcanzado el límite de cartas en mano',
  },
  NO_VIRUS: {
    code: 'NO_VIRUS',
    message: 'Virus no encontrado',
  },
  ORGAN_NOT_INFECTED_OR_VACCINATED: {
    code: 'ORGAN_NOT_INFECTED_OR_VACCINATED',
    message: 'El órgano debe estar infectado o vacunado',
  },
  ORGAN_NOT_VACCINATED: {
    code: 'ORGAN_NOT_VACCINATED',
    message: 'El órgano no está vacunado',
  },
  INVALID_ACTION: {
    code: 'INVALID_ACTION',
    message: 'Acción no válida',
  },
  ORGAN_NOT_INFECTED: {
    code: 'ORGAN_NOT_INFECTED',
    message: 'El órgano no está infectado',
  },
} as const;
