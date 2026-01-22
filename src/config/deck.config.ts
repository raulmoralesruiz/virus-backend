import { CardColor, CardKind, TreatmentSubtype } from '../interfaces/Card.interface.js';

export interface DeckEntry {
  kind: CardKind;
  color: CardColor;
  count: number;
  subtype?: TreatmentSubtype;
}

/**
 * Configuración oficial del mazo base de Virus!
 * Para añadir expansiones o variantes, se modifica aquí.
 */
export const BASE_DECK_CONFIG: DeckEntry[] = [
  // Órganos
  { kind: CardKind.Organ, color: CardColor.Red, count: 5 },
  { kind: CardKind.Organ, color: CardColor.Green, count: 5 },
  { kind: CardKind.Organ, color: CardColor.Blue, count: 5 },
  { kind: CardKind.Organ, color: CardColor.Yellow, count: 5 },
  { kind: CardKind.Organ, color: CardColor.Multi, count: 1 },

  // Virus
  { kind: CardKind.Virus, color: CardColor.Red, count: 4 },
  { kind: CardKind.Virus, color: CardColor.Green, count: 4 },
  { kind: CardKind.Virus, color: CardColor.Blue, count: 4 },
  { kind: CardKind.Virus, color: CardColor.Yellow, count: 4 },
  { kind: CardKind.Virus, color: CardColor.Multi, count: 1 },

  // Medicinas
  { kind: CardKind.Medicine, color: CardColor.Red, count: 4 },
  { kind: CardKind.Medicine, color: CardColor.Green, count: 4 },
  { kind: CardKind.Medicine, color: CardColor.Blue, count: 4 },
  { kind: CardKind.Medicine, color: CardColor.Yellow, count: 4 },
  { kind: CardKind.Medicine, color: CardColor.Multi, count: 4 },

  // Tratamientos
  {
    kind: CardKind.Treatment,
    color: CardColor.Multi,
    count: 2,
    subtype: TreatmentSubtype.Contagion,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Multi,
    count: 3,
    subtype: TreatmentSubtype.OrganThief,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Multi,
    count: 3,
    subtype: TreatmentSubtype.Transplant,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Multi,
    count: 1,
    subtype: TreatmentSubtype.Gloves,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Multi,
    count: 1,
    subtype: TreatmentSubtype.MedicalError,
  },
];

/**
 * Expansión Halloween.
 */
export const EXPANSION_HALLOWEEN_DECK_CONFIG: DeckEntry[] = [
  {
    kind: CardKind.Treatment,
    color: CardColor.Halloween,
    count: 1,
    subtype: TreatmentSubtype.trickOrTreat,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Halloween,
    count: 2,
    subtype: TreatmentSubtype.failedExperiment,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Halloween,
    count: 1,
    subtype: TreatmentSubtype.ColorThiefRed,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Halloween,
    count: 1,
    subtype: TreatmentSubtype.ColorThiefGreen,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Halloween,
    count: 1,
    subtype: TreatmentSubtype.ColorThiefBlue,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Halloween,
    count: 1,
    subtype: TreatmentSubtype.ColorThiefYellow,
  },
  {
    kind: CardKind.Treatment,
    color: CardColor.Halloween,
    count: 1,
    subtype: TreatmentSubtype.BodySwap,
  },
];
