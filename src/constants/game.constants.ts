export const GAME_CONSTANTS = {
  GAME_START: 'game:start', // cliente solicita crear/iniciar partida en una sala
  GAME_STARTED: 'game:started', // respuesta: estado público de la partida (sin manos)
  GAME_HAND: 'game:hand', // respuesta privada a cada jugador: su mano inicial

  GAME_GET_STATE: 'game:getState', // cliente pide estado público
  GAME_STATE: 'game:state', // envío de estado público (broadcast o unicast)
} as const;

// export const GAME_CONSTANTS = {
//   GAME_CREATE: 'game:create',
//   GAME_STARTED: 'game:started',
//   GAME_STATE: 'game:state',
//   GAME_DEAL: 'game:deal',
//   GAME_DRAW: 'game:draw',
//   GAME_PLAY_CARD: 'game:playCard',
//   GAME_END: 'game:end',
// } as const;
