import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import {
  I18nQualityAuditor,
  I18nQualityRule,
  SUPPORTED_LOCALES,
  CONTRACT_ALL_LOCALES,
  EXPECTED_DOMAINS,
} from '../rules/i18n-quality.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: i18n Quality Gates & Contract Guardrails', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const dictionariesDir = path.resolve(rootDir, 'src/common/i18n/dictionaries');
  const bindingsPath = path.resolve(rootDir, 'src/bindings/Locale.ts');
  const rustLocalePath = path.resolve(rootDir, 'src-tauri/src/types/locale.rs');

  describe('Domain Dictionaries Verification (12 domains across 10 locales)', () => {
    it('should confirm all 12 domain dictionary JSON files exist', () => {
      expect(EXPECTED_DOMAINS).toHaveLength(12);

      for (const domain of EXPECTED_DOMAINS) {
        const filePath = path.join(dictionariesDir, `${domain}.json`);
        expect(
          fs.existsSync(filePath),
          `Missing expected domain dictionary file: ${filePath}`
        ).toBe(true);
      }
    });

    EXPECTED_DOMAINS.forEach((domain) => {
      describe(`Domain: ${domain}.json`, () => {
        const filePath = path.join(dictionariesDir, `${domain}.json`);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: Record<string, Record<string, string>> = JSON.parse(content);

        it('should have reference English ("en") translations with non-empty keys', () => {
          expect(data['en'], `Domain "${domain}" must define "en"`).toBeDefined();
          const enKeys = Object.keys(data['en']);
          expect(enKeys.length, `Domain "${domain}" [en] must contain translation keys`).toBeGreaterThan(0);
        });

        it(`should have 100% key completeness across all 10 supported locales relative to English`, () => {
          const enKeys = Object.keys(data['en']);

          for (const locale of SUPPORTED_LOCALES) {
            const locDict = data[locale];
            expect(
              locDict,
              `Domain "${domain}" must have dictionary for supported locale "${locale}"`
            ).toBeDefined();

            const missingKeys = enKeys.filter((key) => !(key in locDict));
            expect(
              missingKeys,
              `Domain "${domain}" [${locale}] is missing ${missingKeys.length} keys: ${missingKeys.join(', ')}`
            ).toEqual([]);
          }
        });

        it(`should have zero empty or whitespace-only translation strings across all 10 locales`, () => {
          const enKeys = Object.keys(data['en']);

          for (const locale of SUPPORTED_LOCALES) {
            const locDict = data[locale];
            for (const key of enKeys) {
              const val = locDict?.[key];
              expect(
                typeof val,
                `Domain "${domain}" [${locale}].${key} must be a string`
              ).toBe('string');
              expect(
                val.trim().length,
                `Domain "${domain}" [${locale}].${key} must not be empty or whitespace-only`
              ).toBeGreaterThan(0);
            }
          }
        });

        it(`should preserve placeholder parity with English across all 10 locales`, () => {
          const enDict = data['en'];

          for (const [key, enText] of Object.entries(enDict)) {
            const enPlaceholders = I18nQualityAuditor.extractPlaceholders(enText);
            if (enPlaceholders.length === 0) continue;

            for (const locale of SUPPORTED_LOCALES) {
              const transText = data[locale][key];
              const transPlaceholders = I18nQualityAuditor.extractPlaceholders(transText);

              // Every English placeholder must be present in the translation
              for (const ph of enPlaceholders) {
                expect(
                  transPlaceholders,
                  `Domain "${domain}" [${locale}].${key} is missing placeholder "{${ph}}" from English "${enText}". Got: "${transText}"`
                ).toContain(ph);
              }

              // No unexpected placeholders should be introduced
              for (const ph of transPlaceholders) {
                expect(
                  enPlaceholders,
                  `Domain "${domain}" [${locale}].${key} introduced unexpected placeholder "{${ph}}" not present in English "${enText}". Got: "${transText}"`
                ).toContain(ph);
              }
            }
          }
        });

        it(`should pass comprehensive I18nQualityAuditor audit with zero violations`, () => {
          const violations = I18nQualityAuditor.auditDomainDictionary(domain, data);
          if (violations.length > 0) {
            const messages = violations.map((v) => `  - [${v.type}] ${v.message}`).join('\n');
            expect.fail(`Found ${violations.length} violations in domain ${domain}:\n${messages}`);
          }
          expect(violations).toHaveLength(0);
        });
      });
    });
  });

  describe('Contract Guardrails & Drift Detector', () => {
    it('should assert that src/bindings/Locale.ts contains all 10 supported locales plus custom and system', () => {
      const tsContent = fs.readFileSync(bindingsPath, 'utf-8');
      const typeMatch = tsContent.match(/export\s+type\s+Locale\s*=\s*([^;]+);/);
      expect(typeMatch, 'Locale.ts must contain export type Locale definition').not.toBeNull();

      const rawUnion = typeMatch![1];
      const parsedVariants = [...rawUnion.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

      // Assert total count is 12 (10 supported locales + custom + system)
      expect(parsedVariants).toHaveLength(CONTRACT_ALL_LOCALES.length);

      // Assert each contract locale is present
      for (const loc of CONTRACT_ALL_LOCALES) {
        expect(parsedVariants, `Locale.ts must include contract locale "${loc}"`).toContain(loc);
      }

    });

    it('should enforce strict 1:1 synchronization between Rust Locale enum and src/bindings/Locale.ts', () => {
      const contractViolations = I18nQualityAuditor.auditLocaleContract(
        bindingsPath,
        rustLocalePath
      );

      if (contractViolations.length > 0) {
        const messages = contractViolations
          .map((v) => `  - [${v.type}] ${v.message}`)
          .join('\n');
        expect.fail(
          `Contract drift detected between Rust Locale enum and Locale.ts:\n${messages}`
        );
      }

      expect(contractViolations).toHaveLength(0);
    });

    it('should ensure src/bindings/Locale.ts has not been manually tampered with and preserves ts-rs banner', () => {
      const tsContent = fs.readFileSync(bindingsPath, 'utf-8');
      expect(tsContent).toContain(
        '// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.'
      );
    });

    it('should pass full architectural rule check with zero violations across entire codebase', () => {
      const rule = new I18nQualityRule();
      const dummyGraph: ModuleGraph = {
        nodes: new Map(),
        adjacencyList: new Map(),
      };

      const violations = rule.check(dummyGraph);

      if (violations.length > 0) {
        const details = violations.map((v) => `  - [${v.file}] ${v.message}`).join('\n');
        expect.fail(
          `Found ${violations.length} architectural i18n quality violation(s):\n${details}`
        );
      }

      expect(violations).toHaveLength(0);
    });
  });
});
