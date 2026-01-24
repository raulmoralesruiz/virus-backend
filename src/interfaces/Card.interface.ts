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
  Halloween = 'halloween', // Especial expansión
  Orange = 'orange', // Órgano Mutante
}

export enum TreatmentSubtype {
  Transplant = 'transplant', // Trasplante
  OrganThief = 'organThief', // Ladrón de Órganos
  Contagion = 'contagion', // Contagio
  Gloves = 'gloves', // Guantes de Látex
  MedicalError = 'medicalError', // Error Médico

  // Halloween
  failedExperiment = 'failedExperiment', // Experimento fallido
  trickOrTreat = 'trickOrTreat', // Truco o trato (calabaza)
  ColorThiefRed = 'colorThiefRed',
  ColorThiefGreen = 'colorThiefGreen',
  ColorThiefBlue = 'colorThiefBlue',
  ColorThiefYellow = 'colorThiefYellow',
  BodySwap = 'bodySwap', // Cambio de cuerpos
  Apparition = 'apparition', // Aparición
  AlienTransplant = 'alienTransplant', // Trasplante Alienígena
}

export interface Card {
  id: string;
  kind: CardKind;
  color: CardColor;
  subtype?: TreatmentSubtype; // Solo para Treatment
}
