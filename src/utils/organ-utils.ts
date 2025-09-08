import { OrganOnBoard } from '../interfaces/Game.interface.js';
import { Card, CardKind, CardColor } from '../interfaces/Card.interface.js';

export const isInfected = (organ: OrganOnBoard): boolean =>
  organ.attached.some(c => c.kind === CardKind.Virus);

export const isVaccinated = (organ: OrganOnBoard): boolean =>
  organ.attached.some(c => c.kind === CardKind.Medicine);

export const isImmune = (organ: OrganOnBoard): boolean => {
  const meds = organ.attached.filter(c => c.kind === CardKind.Medicine);
  return meds.length === 2;
};

export const canReceiveVirus = (organ: OrganOnBoard, virus: Card): boolean => {
  if (isImmune(organ)) return false; // inmune, no puede recibir virus
  return (
    virus.color === CardColor.Multi ||
    organ.color === CardColor.Multi ||
    virus.color === organ.color
  );
};

export const canReceiveMedicine = (organ: OrganOnBoard, med: Card): boolean => {
  return (
    med.color === CardColor.Multi || organ.color === CardColor.Multi || med.color === organ.color
  );
};
