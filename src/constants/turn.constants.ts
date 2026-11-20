// ⏱️ Duración del turno en milisegundos
export const TURN_DURATION_MS = 60_000;

// ⏸️ Tope de tiempo máximo que el timer puede estar pausado por una decisión
// pendiente (p. ej. Aparición). Si se alcanza, la decisión se auto-resuelve
// al comportamiento seguro (conservar la carta y pasar el turno).
export const TIMER_PAUSE_MAX_MS = 90_000;
