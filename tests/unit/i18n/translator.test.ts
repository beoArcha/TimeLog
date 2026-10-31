import { describe, it, expect } from 'vitest';
import { translate } from '@common/i18n/translator';

describe('Unit Tests: new_i18n Subsystem', () => {
  it('should translate common keys correctly in English and Polish', () => {
    expect(translate('en', 'common', 'Save')).toBe('Save');
    expect(translate('pl', 'common', 'Save')).toBe('Zapisz');
    expect(translate('en', 'common', 'Cancel')).toBe('Cancel');
    expect(translate('pl', 'common', 'Cancel')).toBe('Anuluj');
  });

  it('should fall back to English if a translation is missing in the target locale', () => {
    expect(translate('es', 'common', 'Save')).toBe('Guardar');
  });

  it('should support custom dictionary overrides for the custom locale', () => {
    const customDict = {
      common: {
        Save: 'Commit Changes',
      },
      settings: {
        Title: 'Custom Title',
      }
    };

    expect(translate('custom', 'common', 'Save', customDict)).toBe('Commit Changes');
    expect(translate('custom', 'settings', 'Title', customDict)).toBe('Custom Title');
    expect(translate('custom', 'common', 'Cancel', customDict)).toBe('Cancel');
  });

  it('should interpolate variables correctly', () => {
    expect(translate('en', 'database', 'AndMoreRows', undefined, { x: 5 })).toBe('...and 5 more rows');
    expect(translate('pl', 'database', 'AndMoreRows', undefined, { x: 10 })).toBe('...i 10 kolejnych wierszy');
  });

  it('should return the key literal itself if key is missing in all dictionaries', () => {
    expect(translate('en', 'common', 'NonexistentKey' as never)).toBe('NonexistentKey');
  });

  it('should translate Phase 16 billing keys across all supported locales', () => {
    const locales = ['en', 'pl', 'es', 'fr', 'de', 'uk'] as const;
    locales.forEach((loc) => {
      // project billing
      expect(translate(loc, 'project', 'HourlyRate')).toBeTruthy();
      expect(translate(loc, 'project', 'Currency')).toBeTruthy();

      // task billing
      expect(translate(loc, 'task', 'ConfigureRate')).toBeTruthy();
      expect(translate(loc, 'task', 'Rate')).toBeTruthy();
      expect(translate(loc, 'task', 'RateInherit')).toBeTruthy();
      expect(translate(loc, 'task', 'RateNonBillable')).toBeTruthy();
      expect(translate(loc, 'task', 'RateCustom')).toBeTruthy();

      // report billing
      expect(translate(loc, 'report', 'BillingSummary')).toBeTruthy();
      expect(translate(loc, 'report', 'TotalAmount')).toBeTruthy();
      expect(translate(loc, 'report', 'TotalBillableTime')).toBeTruthy();
      expect(translate(loc, 'report', 'BillableTime')).toBeTruthy();
      expect(translate(loc, 'report', 'Amount')).toBeTruthy();
    });

    // Check specific translations
    expect(translate('en', 'task', 'ConfigureRate')).toBe('Configure Hourly Rate');
    expect(translate('pl', 'task', 'ConfigureRate')).toBe('Skonfiguruj stawkę godzinową');
    expect(translate('uk', 'task', 'ConfigureRate')).toBe('Налаштувати погодинну ставку');
    expect(translate('uk', 'project', 'HourlyRate')).toBe('Погодинна ставка');
    expect(translate('uk', 'report', 'BillingSummary')).toBe('Підсумок розрахунків');
  });
});
