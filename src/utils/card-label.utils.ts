import { Card, CardColor, CardKind, TreatmentSubtype } from '../interfaces/Card.interface.js';
import { OrganOnBoard } from '../interfaces/Game.interface.js';

export const COLOR_LABELS: Record<CardColor, string> = {
  [CardColor.Red]: 'Corazón',
  [CardColor.Green]: 'Estómago',
  [CardColor.Blue]: 'Cerebro',
  [CardColor.Yellow]: 'Hueso',
  [CardColor.Multi]: 'Multicolor',
  [CardColor.Halloween]: 'Halloween',
};

export const CARD_KIND_LABELS: Record<CardKind, string> = {
  [CardKind.Organ]: 'Órgano',
  [CardKind.Virus]: 'Virus',
  [CardKind.Medicine]: 'Medicina',
  [CardKind.Treatment]: 'Tratamiento',
};

export const TREATMENT_LABELS: Partial<Record<TreatmentSubtype, string>> = {
  [TreatmentSubtype.Transplant]: 'Trasplante',
  [TreatmentSubtype.OrganThief]: 'Ladrón de Órganos',
  [TreatmentSubtype.Contagion]: 'Contagio',
  [TreatmentSubtype.Gloves]: 'Guantes de Látex',
  [TreatmentSubtype.MedicalError]: 'Error Médico',
  [TreatmentSubtype.failedExperiment]: 'Experimento Fallido',
  [TreatmentSubtype.trickOrTreat]: 'Truco o Trato',
  [TreatmentSubtype.BodySwap]: 'Cambio de Cuerpos',
  [TreatmentSubtype.Apparition]: 'Aparición',
  [TreatmentSubtype.AlienTransplant]: 'Trasplante Alienígena',
};

export const describeColor = (color?: CardColor): string => {
  if (!color) return '';
  return COLOR_LABELS[color] ?? color;
};

export const describeOrganLabel = (organ?: Pick<OrganOnBoard, 'color'> | null): string | null => {
  if (!organ) return null;
  return `${CARD_KIND_LABELS[CardKind.Organ]} ${describeColor(organ.color)}`;
};

export const describeCard = (card?: Card | null): string => {
  if (!card) return 'una carta';

  switch (card.kind) {
    case CardKind.Organ:
      return describeOrganLabel(card) ?? 'un Órgano';
    case CardKind.Virus:
      return `${CARD_KIND_LABELS[CardKind.Virus]} ${describeColor(card.color)}`;
    case CardKind.Medicine:
      return `${CARD_KIND_LABELS[CardKind.Medicine]} ${describeColor(card.color)}`;
    case CardKind.Treatment: {
      const label = card.subtype ? TREATMENT_LABELS[card.subtype] : null;
      return label ?? CARD_KIND_LABELS[CardKind.Treatment];
    }
    default:
      return 'una carta';
  }
};

export const withArticle = (card: Card): string => {
  const noun = describeCard(card);
  switch (card.kind) {
    case CardKind.Medicine:
      return `La ${noun}`;
    default:
      return `El ${noun}`;
  }
};

export const withOrganArticle = (
  organ?: Pick<OrganOnBoard, 'color'> | null,
  options?: { capitalize?: boolean }
): string => {
  const label = describeOrganLabel(organ) ?? 'órgano objetivo';
  const capitalize = options?.capitalize ?? true;
  const article = capitalize ? 'El' : 'el';
  return `${article} ${label}`;
};
