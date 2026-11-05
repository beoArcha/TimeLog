import { describe, it, expect } from 'vitest';
import { translate, dictionaries } from '@common/i18n/translator';

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

  it('should translate Phase 16 billing keys across all 10 supported locales', () => {
    const locales = ['en', 'pl', 'de', 'es', 'pt-br', 'fr', 'uk', 'ja', 'nl', 'it'] as const;
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
    expect(translate('ja', 'task', 'ConfigureRate')).toBe('時間単価を設定');
    expect(translate('ja', 'project', 'HourlyRate')).toBe('時間単価');
    expect(translate('nl', 'task', 'ConfigureRate')).toBe('Uurtarief configureren');
    expect(translate('it', 'task', 'ConfigureRate')).toBe('Configura tariffa oraria');
  });

  it('should verify all 12 domains have complete key parity with English across all 10 locales', () => {
    const allLocales = ['en', 'pl', 'de', 'es', 'pt-br', 'fr', 'uk', 'ja', 'nl', 'it'] as const;
    const domainNames = Object.keys(dictionaries);

    expect(domainNames).toHaveLength(12);

    domainNames.forEach((domain) => {
      const domainDict = dictionaries[domain];
      const enKeys = Object.keys(domainDict['en']);
      expect(enKeys.length).toBeGreaterThan(0);

      allLocales.forEach((loc) => {
        expect(domainDict[loc], `Domain "${domain}" must have locale "${loc}"`).toBeDefined();
        const locKeys = Object.keys(domainDict[loc]);
        expect(locKeys.length, `Domain "${domain}" [${loc}] key count must match English`).toBe(enKeys.length);
        const missing = enKeys.filter((k) => !(k in domainDict[loc]));
        expect(missing, `Domain "${domain}" [${loc}] missing keys: ${missing.join(', ')}`).toEqual([]);
      });
    });
  });

  it('should verify no empty translation strings across all 12 domains and all 10 locales', () => {
    const allLocales = ['en', 'pl', 'de', 'es', 'pt-br', 'fr', 'uk', 'ja', 'nl', 'it'] as const;

    Object.entries(dictionaries).forEach(([domain, domainDict]) => {
      const enKeys = Object.keys(domainDict['en']);

      allLocales.forEach((loc) => {
        enKeys.forEach((key) => {
          const val = domainDict[loc]?.[key];
          expect(typeof val, `Domain "${domain}" [${loc}].${key} must be a string`).toBe('string');
          expect(val.trim().length, `Domain "${domain}" [${loc}].${key} must not be empty`).toBeGreaterThan(0);
        });
      });
    });
  });

  it('should maintain placeholder parity with English across all 12 domains and all 10 locales', () => {
    const allLocales = ['en', 'pl', 'de', 'es', 'pt-br', 'fr', 'uk', 'ja', 'nl', 'it'] as const;
    const varRegex = /\{([^}]+)\}/g;

    Object.entries(dictionaries).forEach(([domain, domainDict]) => {
      const enDict = domainDict['en'];

      Object.entries(enDict).forEach(([key, enText]) => {
        const enVars = [...enText.matchAll(varRegex)].map((m) => m[1]);
        if (enVars.length === 0) return;

        allLocales.forEach((loc) => {
          const targetText = domainDict[loc][key];
          const targetVars = [...targetText.matchAll(varRegex)].map((m) => m[1]);

          enVars.forEach((v) => {
            expect(
              targetVars,
              `Domain "${domain}" [${loc}].${key} must include placeholder {${v}}. Found: "${targetText}"`
            ).toContain(v);
          });
        });
      });
    });
  });

  it('should translate domain keys in Japanese, Dutch, Italian, and Ukrainian correctly', () => {
    // Japanese
    expect(translate('ja', 'common', 'Save')).toBe('保存');
    expect(translate('ja', 'project', 'NewProject')).toBe('新規プロジェクト');
    expect(translate('ja', 'task', 'AddTask')).toBe('タスクを追加');
    expect(translate('ja', 'timer', 'StartTimer')).toBe('開始');
    expect(translate('ja', 'database', 'AndMoreRows', undefined, { x: 5 })).toBe('...他 5 行');
    expect(translate('ja', 'calendar', 'HolidaysLeaves')).toBe('祝日と休暇');
    expect(translate('ja', 'cli', 'TabCli')).toBe('CLIコンソール');

    // Dutch
    expect(translate('nl', 'common', 'Save')).toBe('Opslaan');
    expect(translate('nl', 'project', 'NewProject')).toBe('Nieuw project');
    expect(translate('nl', 'task', 'AddTask')).toBe('Taak toevoegen');
    expect(translate('nl', 'timer', 'StartTimer')).toBe('Start');
    expect(translate('nl', 'database', 'AndMoreRows', undefined, { x: 5 })).toBe('...en nog 5 rijen');
    expect(translate('nl', 'calendar', 'HolidaysLeaves')).toBe('Feestdagen & Vakanties');
    expect(translate('nl', 'cli', 'TabCli')).toBe('CLI Console');

    // Italian
    expect(translate('it', 'common', 'Save')).toBe('Salva');
    expect(translate('it', 'project', 'NewProject')).toBe('Nuovo progetto');
    expect(translate('it', 'task', 'AddTask')).toBe('Aggiungi attività');
    expect(translate('it', 'timer', 'StartTimer')).toBe('Avvia');
    expect(translate('it', 'database', 'AndMoreRows', undefined, { x: 5 })).toBe('...e altre 5 righe');
    expect(translate('it', 'calendar', 'HolidaysLeaves')).toBe('Festività e Ferie');
    expect(translate('it', 'cli', 'TabCli')).toBe('Console CLI');

    // Ukrainian backfilled domains
    expect(translate('uk', 'app', 'AppCrashTitle')).toBe('Помилка програми');
    expect(translate('uk', 'calendar', 'HolidaysLeaves')).toBe('Свята та відпустки');
    expect(translate('uk', 'cli', 'TabCli')).toBe('Консоль CLI');
    expect(translate('uk', 'database', 'AndMoreRows', undefined, { x: 5 })).toBe('...і ще 5 рядків');
    expect(translate('uk', 'engine', 'Ready')).toBe('Двигун: Готовий');
    expect(translate('uk', 'settings', 'Theme')).toBe('Тема інтерфейсу');
    expect(translate('uk', 'timer', 'StartTimer')).toBe('Старт');
  });
});
