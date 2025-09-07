import {
  isInfected,
  isVaccinated,
  isImmune,
  canReceiveVirus,
  canReceiveMedicine,
} from './organ-utils.js';
import { CardKind, CardColor, Card } from '../interfaces/Card.interface.js';
import { OrganOnBoard } from '../interfaces/Game.interface.js';

const mkOrgan = (color: CardColor, attached: Card[] = []): OrganOnBoard => ({
  id: `organ_${color}`,
  kind: CardKind.Organ,
  color,
  attached,
});

describe('organ-utils', () => {
  describe('isInfected', () => {
    test('true si tiene al menos un virus', () => {
      const organ = mkOrgan(CardColor.Green, [
        { id: 'v1', kind: CardKind.Virus, color: CardColor.Green },
      ]);
      expect(isInfected(organ)).toBe(true);
    });

    test('false si no tiene virus', () => {
      const organ = mkOrgan(CardColor.Green, []);
      expect(isInfected(organ)).toBe(false);
    });
  });

  describe('isVaccinated', () => {
    test('true si tiene al menos una medicina', () => {
      const organ = mkOrgan(CardColor.Blue, [
        { id: 'm1', kind: CardKind.Medicine, color: CardColor.Blue },
      ]);
      expect(isVaccinated(organ)).toBe(true);
    });

    test('false si no tiene medicinas', () => {
      const organ = mkOrgan(CardColor.Blue, []);
      expect(isVaccinated(organ)).toBe(false);
    });
  });

  describe('isImmune', () => {
    test('true si tiene exactamente 2 medicinas', () => {
      const organ = mkOrgan(CardColor.Red, [
        { id: 'm1', kind: CardKind.Medicine, color: CardColor.Red },
        { id: 'm2', kind: CardKind.Medicine, color: CardColor.Red },
      ]);
      expect(isImmune(organ)).toBe(true);
    });

    test('false si tiene menos de 2 medicinas', () => {
      const organ = mkOrgan(CardColor.Red, [
        { id: 'm1', kind: CardKind.Medicine, color: CardColor.Red },
      ]);
      expect(isImmune(organ)).toBe(false);
    });

    test('false si tiene más de 2 medicinas (aunque raro)', () => {
      const organ = mkOrgan(CardColor.Red, [
        { id: 'm1', kind: CardKind.Medicine, color: CardColor.Red },
        { id: 'm2', kind: CardKind.Medicine, color: CardColor.Red },
        { id: 'm3', kind: CardKind.Medicine, color: CardColor.Red },
      ]);
      expect(isImmune(organ)).toBe(false);
    });
  });

  describe('canReceiveVirus', () => {
    test('false si el órgano es inmune', () => {
      const organ = mkOrgan(CardColor.Yellow, [
        { id: 'm1', kind: CardKind.Medicine, color: CardColor.Yellow },
        { id: 'm2', kind: CardKind.Medicine, color: CardColor.Yellow },
      ]);
      const virus: Card = { id: 'v1', kind: CardKind.Virus, color: CardColor.Yellow };
      expect(canReceiveVirus(organ, virus)).toBe(false);
    });

    test('true si el virus y el órgano tienen el mismo color', () => {
      const organ = mkOrgan(CardColor.Green);
      const virus: Card = { id: 'v1', kind: CardKind.Virus, color: CardColor.Green };
      expect(canReceiveVirus(organ, virus)).toBe(true);
    });

    test('true si el virus es multicolor', () => {
      const organ = mkOrgan(CardColor.Red);
      const virus: Card = { id: 'v1', kind: CardKind.Virus, color: CardColor.Multi };
      expect(canReceiveVirus(organ, virus)).toBe(true);
    });

    test('true si el órgano es multicolor', () => {
      const organ = mkOrgan(CardColor.Multi);
      const virus: Card = { id: 'v1', kind: CardKind.Virus, color: CardColor.Blue };
      expect(canReceiveVirus(organ, virus)).toBe(true);
    });

    test('false si colores no coinciden ni son multi', () => {
      const organ = mkOrgan(CardColor.Green);
      const virus: Card = { id: 'v1', kind: CardKind.Virus, color: CardColor.Red };
      expect(canReceiveVirus(organ, virus)).toBe(false);
    });
  });

  describe('canReceiveMedicine', () => {
    test('true si la medicina y el órgano tienen el mismo color', () => {
      const organ = mkOrgan(CardColor.Blue);
      const med: Card = { id: 'm1', kind: CardKind.Medicine, color: CardColor.Blue };
      expect(canReceiveMedicine(organ, med)).toBe(true);
    });

    test('true si la medicina es multicolor', () => {
      const organ = mkOrgan(CardColor.Red);
      const med: Card = { id: 'm1', kind: CardKind.Medicine, color: CardColor.Multi };
      expect(canReceiveMedicine(organ, med)).toBe(true);
    });

    test('true si el órgano es multicolor', () => {
      const organ = mkOrgan(CardColor.Multi);
      const med: Card = { id: 'm1', kind: CardKind.Medicine, color: CardColor.Green };
      expect(canReceiveMedicine(organ, med)).toBe(true);
    });

    test('false si colores no coinciden ni son multi', () => {
      const organ = mkOrgan(CardColor.Green);
      const med: Card = { id: 'm1', kind: CardKind.Medicine, color: CardColor.Red };
      expect(canReceiveMedicine(organ, med)).toBe(false);
    });
  });
});
