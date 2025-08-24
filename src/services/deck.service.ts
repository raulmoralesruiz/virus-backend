import { Card } from '../interfaces/Card.interface.js';
import {
  DeckEntry,
  BASE_DECK_CONFIG,
  EXPANSION_HALLOWEEN_DECK_CONFIG,
} from '../config/deck.config.js';

/**
 * Baraja un array usando Fisher–Yates.
 */
export const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Construye un mazo a partir de la definición de configuración.
 * IDs deterministas: kind_color_subtype_index
 */
export const buildDeckFromConfig = (config: DeckEntry[]): Card[] => {
  const cards: Card[] = [];

  for (const entry of config) {
    for (let i = 1; i <= entry.count; i++) {
      const subtypePart = entry.subtype ? `_${entry.subtype}` : '';
      const id = `${entry.kind}_${entry.color}${subtypePart}_${i}`;

      cards.push({
        id,
        kind: entry.kind,
        color: entry.color,
        subtype: entry.subtype,
      });
    }
  }

  return cards;
};

/**
 * Construye el mazo final mezclando base y expansiones activadas.
 */
export const buildDeck = (): Card[] => {
  const base = buildDeckFromConfig(BASE_DECK_CONFIG);
  const halloween = buildDeckFromConfig(EXPANSION_HALLOWEEN_DECK_CONFIG);
  return shuffle([...base, ...halloween]);
};
