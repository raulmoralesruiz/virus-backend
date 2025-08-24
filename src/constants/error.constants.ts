export interface GameError {
  code: string;
  message: string;
}

export const GAME_ERRORS = {
  NO_PLAYER: {
    code: 'NO_PLAYER',
    message: 'Jugador no identificado',
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
    message: 'El virus no coincide en color con el órgano',
  },
  UNSUPPORTED_CARD: {
    code: 'UNSUPPORTED_CARD',
    message: 'Tipo de carta no soportado aún',
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Error interno',
  },
} as const;
