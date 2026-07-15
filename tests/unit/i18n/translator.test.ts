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
});
