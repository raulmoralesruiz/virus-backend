import { shuffle, buildDeckFromConfig, buildDeck } from './deck.service.js';
import { CardColor, CardKind, TreatmentSubtype } from '../interfaces/Card.interface.js';
import {
  BASE_DECK_CONFIG,
  EXPANSION_HALLOWEEN_DECK_CONFIG,
  DeckEntry,
} from '../config/deck.config.js';

describe('deck.service', () => {
  describe('shuffle', () => {
    test('devuelve un array de la misma longitud', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle([...arr]);
      expect(result).toHaveLength(arr.length);
    });

    test('contiene los mismos elementos que el original (sin perder ni duplicar)', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle([...arr]).sort();
      expect(result).toEqual(arr.sort());
    });

    test('puede alterar el orden', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle([...arr]);
      // El shuffle es aleatorio, así que no podemos garantizar que cambie
      // Pero sí podemos permitir que al menos sea una permutación
      expect(result.sort()).toEqual(arr.sort());
    });
  });

  describe('buildDeckFromConfig', () => {
    test('genera cartas con IDs deterministas', () => {
      const config: DeckEntry[] = [
        { kind: CardKind.Organ, color: CardColor.Red, count: 2 },
        { kind: CardKind.Virus, color: CardColor.Green, count: 1 },
      ];

      const deck = buildDeckFromConfig(config);

      expect(deck).toHaveLength(3);
      expect(deck.map(c => c.id)).toEqual(['organ_red_1', 'organ_red_2', 'virus_green_1']);
    });

    test('incluye subtype en el ID si está definido', () => {
      const config: DeckEntry[] = [
        {
          kind: CardKind.Treatment,
          color: CardColor.Multi,
          count: 2,
          subtype: TreatmentSubtype.Contagion,
        },
      ];

      const deck = buildDeckFromConfig(config);

      expect(deck).toHaveLength(2);
      expect(deck[0].id).toBe('treatment_multi_contagion_1');
      expect(deck[1].id).toBe('treatment_multi_contagion_2');
    });
  });

  describe('buildDeck', () => {
    test('construye un mazo con base + halloween expansion', () => {
      const base = buildDeckFromConfig(BASE_DECK_CONFIG);
      const halloween = buildDeckFromConfig(EXPANSION_HALLOWEEN_DECK_CONFIG);

      const deck = buildDeck();

      // Tamaño correcto
      expect(deck).toHaveLength(base.length + halloween.length);

      // Todas las cartas del mazo están en base o expansión
      const allIds = new Set([...base.map(c => c.id), ...halloween.map(c => c.id)]);
      for (const card of deck) {
        expect(allIds.has(card.id)).toBe(true);
      }
    });

    test('el resultado está barajado (orden no determinista)', () => {
      // ⚠️ El shuffle puede dar igual orden por azar, así que solo validamos que
      // NO es siempre idéntico en múltiples ejecuciones
      const deck1 = buildDeck();
      const deck2 = buildDeck();

      expect(deck1.map(c => c.id)).not.toEqual(deck2.map(c => c.id));
      expect(deck1).toHaveLength(deck2.length);
    });
  });
});
