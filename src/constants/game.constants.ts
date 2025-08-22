export const GAME_CONSTANTS = {
  GAME_START: 'game:start', // cliente solicita crear/iniciar partida en una sala
  GAME_STARTED: 'game:started', // respuesta: estado público de la partida (sin manos)
  GAME_HAND: 'game:hand', // respuesta privada a cada jugador: su mano inicial

  GAME_GET_STATE: 'game:getState', // cliente pide estado público
  GAME_STATE: 'game:state', // envío de estado público (broadcast o unicast)

  GAME_DRAW: 'game:draw', // cliente solicita robar carta
  GAME_ERROR: 'game:error',
} as const;
