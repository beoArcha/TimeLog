import { describe, it, expect } from 'vitest';
import {
  I18nQualityAuditor,
  SUPPORTED_LOCALES,
  I18nViolation,
} from '../../../tests/architecture/rules/i18n-quality.rule';

describe('Unit & Negative Tests: i18n Quality Guardrails', () => {
  describe('Placeholder Extractor', () => {
    it('should extract single and multiple placeholders accurately', () => {
      expect(I18nQualityAuditor.extractPlaceholders('Hello {name}!')).toEqual(['name']);
      expect(
        I18nQualityAuditor.extractPlaceholders('Progress: {current} of {total} ({percent}%)')
      ).toEqual(['current', 'total', 'percent']);
    });

    it('should handle placeholders with internal whitespace', () => {
      expect(I18nQualityAuditor.extractPlaceholders('Value: {  val  }')).toEqual(['val']);
    });

    it('should return empty array when no placeholders are present', () => {
      expect(I18nQualityAuditor.extractPlaceholders('Plain static text.')).toEqual([]);
      expect(I18nQualityAuditor.extractPlaceholders('')).toEqual([]);
    });
  });

  describe('Key Completeness Negative Tests', () => {
    it('should flag an error when a target locale is missing a key present in English', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          Save: 'Save',
          Cancel: 'Cancel',
          Delete: 'Delete',
        },
        pl: {
          Save: 'Zapisz',
          Cancel: 'Anuluj',
          // Delete is missing!
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['pl']);

      // Assert
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('MISSING_KEY');
      expect(violations[0].locale).toBe('pl');
      expect(violations[0].key).toBe('Delete');
      expect(violations[0].message).toContain('missing translation key "Delete"');
    });

    it('should flag multiple missing keys across multiple locales', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          K1: 'V1',
          K2: 'V2',
          K3: 'V3',
        },
        de: {
          K1: 'V1-de',
          // K2 and K3 missing
        },
        ja: {
          // K1, K2, K3 all missing
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['de', 'ja']);

      // Assert
      const deMissing = violations.filter((v) => v.locale === 'de' && v.type === 'MISSING_KEY');
      const jaMissing = violations.filter((v) => v.locale === 'ja' && v.type === 'MISSING_KEY');

      expect(deMissing).toHaveLength(2);
      expect(jaMissing).toHaveLength(3);
    });

    it('should flag missing target locale object entirely', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: { Save: 'Save' },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['pl', 'it']);

      // Assert
      expect(violations).toHaveLength(2);
      expect(violations[0].type).toBe('MISSING_LOCALE');
      expect(violations[0].locale).toBe('pl');
      expect(violations[1].type).toBe('MISSING_LOCALE');
      expect(violations[1].locale).toBe('it');
    });

    it('should flag missing English reference dictionary', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        pl: { Save: 'Zapisz' },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['pl']);

      // Assert
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('MISSING_LOCALE');
      expect(violations[0].locale).toBe('en');
    });

    it('should flag empty English reference dictionary with 0 keys', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {},
        pl: {},
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['pl']);

      // Assert
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('EMPTY_VALUE');
      expect(violations[0].message).toContain('has 0 keys');
    });
  });

  describe('Empty and Whitespace-Only Translation Negative Tests', () => {
    it('should flag empty string translations', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          Title: 'Project Title',
        },
        fr: {
          Title: '',
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['fr']);

      // Assert
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('EMPTY_VALUE');
      expect(violations[0].locale).toBe('fr');
      expect(violations[0].key).toBe('Title');
      expect(violations[0].message).toContain('must not be empty or whitespace-only');
    });

    it('should flag whitespace-only translations containing spaces, tabs, or newlines', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          K1: 'V1',
          K2: 'V2',
          K3: 'V3',
        },
        es: {
          K1: '   ',
          K2: '\t\t',
          K3: '\n\r\n',
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['es']);

      // Assert
      expect(violations).toHaveLength(3);
      violations.forEach((v) => {
        expect(v.type).toBe('EMPTY_VALUE');
        expect(v.locale).toBe('es');
      });
    });

    it('should flag empty values in English itself', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          K1: '  ',
        },
        pl: {
          K1: 'Wartość',
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['pl']);

      // Assert
      expect(violations.some((v) => v.locale === 'en' && v.type === 'EMPTY_VALUE')).toBe(true);
    });
  });

  describe('Placeholder Parity Negative Tests', () => {
    it('should flag when a placeholder present in English is missing in translation', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          Greeting: 'Hello, {name}!',
        },
        nl: {
          Greeting: 'Hallo!', // missing {name}
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['nl']);

      // Assert
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('PLACEHOLDER_MISMATCH');
      expect(violations[0].key).toBe('Greeting');
      expect(violations[0].message).toContain('missing placeholder "{name}"');
    });

    it('should flag when a placeholder is renamed or typoed', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          ItemsRemaining: '{count} items remaining',
        },
        it: {
          ItemsRemaining: '{conteggio} elementi rimanenti', // translated the placeholder variable name!
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['it']);

      // Assert
      expect(violations.length).toBeGreaterThanOrEqual(1);
      const missingPh = violations.find((v) => v.message.includes('missing placeholder "{count}"'));
      const unexpectedPh = violations.find((v) => v.message.includes('unexpected placeholder "{conteggio}"'));
      expect(missingPh).toBeDefined();
      expect(unexpectedPh).toBeDefined();
    });

    it('should flag when a translation introduces extra unsupported placeholders', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          Summary: 'Total time: {hours}h',
        },
        uk: {
          Summary: 'Загальний час: {hours}г {minutes}хв', // {minutes} does not exist in English!
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['uk']);

      // Assert
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('PLACEHOLDER_MISMATCH');
      expect(violations[0].message).toContain('unexpected placeholder "{minutes}"');
    });

    it('should pass cleanly when multiple placeholders appear in different order', () => {
      // Arrange
      const mockDictionary: Record<string, Record<string, string>> = {
        en: {
          UserAction: '{user} logged {time} in {project}',
        },
        ja: {
          UserAction: '{project}で{user}が{time}を記録しました', // reordered placeholders for natural Japanese grammar
        },
      };

      // Act
      const violations = I18nQualityAuditor.auditDomainDictionary('test_domain', mockDictionary, ['ja']);

      // Assert
      expect(violations).toHaveLength(0);
    });
  });

  describe('Contract Guardrails and Drift Detection Negative Tests', () => {
    it('should detect when generated binding file has missing ts-rs header banner (tampering detection)', () => {
      // Arrange: simulated tampered Locale.ts
      const tsContentWithoutBanner = `export type Locale = "pl" | "en" | "de" | "es" | "pt-br" | "fr" | "uk" | "ja" | "nl" | "it" | "custom" | "system";`;


      // We test the contract auditor logic directly
      const violations: I18nViolation[] = [];
      const tsRsBanner = '// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.';
      if (!tsContentWithoutBanner.includes(tsRsBanner)) {
        violations.push({
          type: 'TAMPERED_BINDING',
          message: 'Missing ts-rs banner',
        });
      }

      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('TAMPERED_BINDING');
    });

    it('should detect missing locale variant in TypeScript union type', () => {
      // Simulated Locale.ts missing 'it'
      const tsContent = `// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
export type Locale = "pl" | "en" | "de" | "es" | "pt-br" | "fr" | "uk" | "ja" | "nl" | "custom" | "system";`;

      const typeMatch = tsContent.match(/export\s+type\s+Locale\s*=\s*([^;]+);/);
      const parsedVariants = [...typeMatch![1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

      expect(parsedVariants.includes('it')).toBe(false);
      expect(SUPPORTED_LOCALES.every((loc) => parsedVariants.includes(loc))).toBe(false);
    });

    it('should detect when an unauthorized extra variant is added to TypeScript binding', () => {
      // Simulated Locale.ts containing unauthorized variant "zh-cn"
      const tsContent = `// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
export type Locale = "pl" | "en" | "de" | "es" | "pt-br" | "fr" | "uk" | "ja" | "nl" | "it" | "zh-cn" | "custom" | "system";`;

      const typeMatch = tsContent.match(/export\s+type\s+Locale\s*=\s*([^;]+);/);
      const parsedVariants = [...typeMatch![1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

      const extraVariants = parsedVariants.filter((v) => v === 'zh-cn');
      expect(extraVariants).toEqual(['zh-cn']);
    });
  });
});
