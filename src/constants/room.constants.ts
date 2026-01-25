export const ROOM_CONSTANTS = {
  ROOM_NEW: 'room:new', // (no usado en híbrida, pero reservado)
  ROOM_CREATED: 'room:created', // (no usado en híbrida, pero reservado)

  ROOM_JOIN: 'room:join', // (no usado en híbrida, pero reservado)
  ROOM_JOINED: 'room:joined', // (no usado en híbrida, pero reservado)

  ROOM_LEAVE: 'room:leave',

  ROOM_GET_ALL: 'room:getAll', // (no usado en híbrida, pero reservado)
  ROOMS_LIST: 'rooms:list', // usado para broadcast del lobby
  ROOM_CONFIG_UPDATE: 'room:config:update',
} as const;

export const MAX_ROOM_PLAYERS = 6;
