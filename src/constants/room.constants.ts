export const ROOM_CONSTANTS = {
  ROOM_NEW: 'room:new', // (no usado en híbrida, pero reservado)
  ROOM_CREATED: 'room:created', // (no usado en híbrida, pero reservado)

  ROOM_JOIN: 'room:join', // (no usado en híbrida, pero reservado)
  ROOM_JOINED: 'room:joined', // (no usado en híbrida, pero reservado)

  ROOM_LEAVE: 'room:leave',

  ROOM_GET_ALL: 'room:getAll', // (no usado en híbrida, pero reservado)
  ROOMS_LIST: 'rooms:list', // usado para broadcast del lobby
} as const;
