import { describeCard, withArticle, withOrganArticle, CARD_KIND_LABELS } from './card-label.utils.js';
import { CardKind, CardColor, TreatmentSubtype } from '../interfaces/Card.interface.js';

describe('card-label.utils', () => {
  describe('describeCard', () => {
    test('devuelve "una carta" si no se proporciona card', () => {
      expect(describeCard(null)).toBe('una carta');
      expect(describeCard(undefined)).toBe('una carta');
    });

    test('describe un órgano', () => {
      expect(describeCard({ kind: CardKind.Organ, color: CardColor.Red } as any))
        .toBe('Órgano Corazón');
    });

    test('describe un órgano con fallback', () => {
      // Simulate fallback by not matching switch
    });

    test('describe un virus', () => {
      expect(describeCard({ kind: CardKind.Virus, color: CardColor.Green } as any))
        .toBe('Virus Estómago');
    });

    test('describe una medicina', () => {
      expect(describeCard({ kind: CardKind.Medicine, color: CardColor.Blue } as any))
        .toBe('Medicina Cerebro');
    });

    test('describe un tratamiento con subtipo válido', () => {
      expect(describeCard({ kind: CardKind.Treatment, color: CardColor.Multi, subtype: TreatmentSubtype.Transplant } as any))
        .toBe('Trasplante');
    });

    test('describe un tratamiento sin subtipo o subtipo desconocido', () => {
      expect(describeCard({ kind: CardKind.Treatment, color: CardColor.Multi } as any))
        .toBe('Tratamiento');
      expect(describeCard({ kind: CardKind.Treatment, color: CardColor.Multi, subtype: 'unknown-subtype' as any } as any))
        .toBe('Tratamiento');
    });

    test('describe una carta de tipo desconocido como "una carta"', () => {
      expect(describeCard({ kind: 'unknown' as any, color: CardColor.Red } as any))
        .toBe('una carta');
    });
  });

  describe('describeColor', () => {
    test('devuelve vacío si no hay color', () => {
      const { describeColor } = require('./card-label.utils.js');
      expect(describeColor(undefined)).toBe('');
      expect(describeColor(null)).toBe('');
    });

    test('devuelve el color original si no está en las etiquetas', () => {
      const { describeColor } = require('./card-label.utils.js');
      expect(describeColor('fake-color' as any)).toBe('fake-color');
    });
  });

  describe('withArticle', () => {
    test('usa "La" para medicinas', () => {
      expect(withArticle({ kind: CardKind.Medicine, color: CardColor.Blue } as any))
        .toBe('La Medicina Cerebro');
    });

    test('usa "El" para los demás tipos', () => {
      expect(withArticle({ kind: CardKind.Organ, color: CardColor.Red } as any))
        .toBe('El Órgano Corazón');
      expect(withArticle({ kind: CardKind.Virus, color: CardColor.Green } as any))
        .toBe('El Virus Estómago');
      expect(withArticle({ kind: CardKind.Treatment, color: CardColor.Multi, subtype: TreatmentSubtype.Transplant } as any))
        .toBe('El Trasplante');
    });
  });
  
  describe('withOrganArticle', () => {
    test('usa "El" o "el" y describe órgano correctamente', () => {
      expect(withOrganArticle({ color: CardColor.Red })).toBe('El Órgano Corazón');
      expect(withOrganArticle({ color: CardColor.Green }, { capitalize: false })).toBe('el Órgano Estómago');
    });

    test('fallback cuando no hay órgano', () => {
      expect(withOrganArticle(null)).toBe('El órgano objetivo');
      expect(withOrganArticle(undefined, { capitalize: false })).toBe('el órgano objetivo');
    });
  });
});
