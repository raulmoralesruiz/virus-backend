// backend/src/interfaces/Card.interface.ts
export enum CardKind {
  Organ = 'organ',
  Virus = 'virus',
  Medicine = 'medicine',
  Treatment = 'treatment',
}

export enum CardColor {
  Red = 'red', // Corazón
  Green = 'green', // Estómago
  Blue = 'blue', // Cerebro
  Yellow = 'yellow', // Hueso
  Multi = 'multi', // Multicolor (afecta a todos)
}

export interface Card {
  id: string; // uuid por carta en el mazo
  kind: CardKind;
  color: CardColor;
  // En el futuro: subtype/efecto para tratamientos, etc.
}
