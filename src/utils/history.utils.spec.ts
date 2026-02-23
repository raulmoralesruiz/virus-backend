import { GameState } from '../interfaces/Game.interface.js';
import { pushHistoryEntry, HISTORY_LIMIT } from './history.utils.js';

describe('pushHistoryEntry', () => {
  let mockGame: GameState;

  beforeEach(() => {
    mockGame = {
      history: [],
    } as unknown as GameState;
  });

  test('no hace nada si game o entry no existen', () => {
    pushHistoryEntry(null, 'entry');
    pushHistoryEntry(mockGame, null);
    pushHistoryEntry(undefined, undefined);
    expect(mockGame.history).toHaveLength(0);
  });

  test('añade un elemento al principio del historial', () => {
    pushHistoryEntry(mockGame, 'first');
    pushHistoryEntry(mockGame, 'second');
    
    expect(mockGame.history).toEqual(['second', 'first']);
  });

  test(`limita el historial a ${HISTORY_LIMIT} elementos`, () => {
    // Llenar justo hasta el límite
    for(let i = 0; i < HISTORY_LIMIT; i++) {
        mockGame.history.push(`old`);
    }

    expect(mockGame.history).toHaveLength(HISTORY_LIMIT);
    
    // Agregar uno más debe eliminar el más antiguo (el último)
    pushHistoryEntry(mockGame, 'new-entry');
    
    expect(mockGame.history).toHaveLength(HISTORY_LIMIT);
    expect(mockGame.history[0]).toBe('new-entry');
  });
});
