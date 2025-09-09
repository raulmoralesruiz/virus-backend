export const GAME_CONSTANTS = {
  GAME_START: 'game:start', // cliente solicita crear/iniciar partida en una sala
  GAME_STARTED: 'game:started', // respuesta: estado público de la partida (sin manos)
  GAME_HAND: 'game:hand', // respuesta privada a cada jugador: su mano inicial

  GAME_GET_STATE: 'game:getState', // cliente pide estado público
  GAME_STATE: 'game:state', // envío de estado público (broadcast o unicast)

  GAME_DRAW: 'game:draw', // cliente solicita robar carta
  GAME_DISCARD: 'game:discard',
  GAME_ERROR: 'game:error',

  GAME_END_TURN: 'game:end-turn', // cliente → server
  GAME_TURN_STARTED: 'game:turn-started', // (opcional) server → clientes; usamos GAME_STATE igualmente

  GAME_END: 'game:end',
  ROOM_RESET: 'room:reset',

  GAME_PLAY_CARD: 'game:play-card',
} as const;
