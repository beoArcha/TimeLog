import fs from 'fs';
import path from 'path';
import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';

export const SUPPORTED_LOCALES = [
  'en',
  'pl',
  'de',
  'es',
  'pt-br',
  'fr',
  'uk',
  'ja',
  'nl',
  'it',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const CONTRACT_ALL_LOCALES = [
  'pl',
  'en',
  'de',
  'es',
  'pt-br',
  'fr',
  'uk',
  'ja',
  'nl',
  'it',
  'custom',
  'system',
] as const;

export type ContractLocale = (typeof CONTRACT_ALL_LOCALES)[number];

export const EXPECTED_DOMAINS = [
  'app',
  'calendar',
  'cli',
  'common',
  'database',
  'engine',
  'help',
  'project',
  'report',
  'settings',
  'task',
  'timer',
] as const;

export type DomainName = (typeof EXPECTED_DOMAINS)[number];

export type I18nViolationType =
  | 'MISSING_KEY'
  | 'EMPTY_VALUE'
  | 'PLACEHOLDER_MISMATCH'
  | 'MISSING_LOCALE'
  | 'MISSING_FILE'
  | 'CONTRACT_DRIFT'
  | 'TAMPERED_BINDING';

export interface I18nViolation {
  domain?: string;
  locale?: string;
  key?: string;
  type: I18nViolationType;
  message: string;
}

export class I18nQualityAuditor {
  private static readonly PLACEHOLDER_REGEX = /\{([^}]+)\}/g;

  /**
   * Extract all variable placeholder names from a template string
   * (e.g. "{name} has {count} items" -> ["name", "count"]).
   */
  public static extractPlaceholders(text: string): string[] {
    const matches: string[] = [];
    const regex = new RegExp(this.PLACEHOLDER_REGEX);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  }

  /**
   * Audits a parsed domain dictionary object against the English reference.
   * Dictionary structure: { [locale: string]: { [key: string]: string } }
   */
  public static auditDomainDictionary(
    domain: string,
    dictionaryData: Record<string, Record<string, string>>,
    targetLocales: readonly string[] = SUPPORTED_LOCALES
  ): I18nViolation[] {
    const violations: I18nViolation[] = [];

    const enDict = dictionaryData['en'];
    if (!enDict || typeof enDict !== 'object') {
      violations.push({
        domain,
        locale: 'en',
        type: 'MISSING_LOCALE',
        message: `Domain "${domain}" is missing the reference English ("en") translations dictionary.`,
      });
      return violations;
    }

    const enKeys = Object.keys(enDict);
    if (enKeys.length === 0) {
      violations.push({
        domain,
        locale: 'en',
        type: 'EMPTY_VALUE',
        message: `Domain "${domain}" reference English ("en") dictionary has 0 keys.`,
      });
      return violations;
    }

    // Check English keys themselves for empty / whitespace-only values
    for (const key of enKeys) {
      const enVal = enDict[key];
      if (typeof enVal !== 'string' || enVal.trim().length === 0) {
        violations.push({
          domain,
          locale: 'en',
          key,
          type: 'EMPTY_VALUE',
          message: `Domain "${domain}" [en].${key} must not be empty or whitespace-only.`,
        });
      }
    }

    // Audit each target locale against English
    for (const locale of targetLocales) {
      const locDict = dictionaryData[locale];
      if (!locDict || typeof locDict !== 'object') {
        violations.push({
          domain,
          locale,
          type: 'MISSING_LOCALE',
          message: `Domain "${domain}" is missing translations dictionary for target locale "${locale}".`,
        });
        continue;
      }

      for (const key of enKeys) {
        if (!(key in locDict)) {
          violations.push({
            domain,
            locale,
            key,
            type: 'MISSING_KEY',
            message: `Domain "${domain}" [${locale}] is missing translation key "${key}" (present in English).`,
          });
          continue;
        }

        const transVal = locDict[key];
        if (typeof transVal !== 'string' || transVal.trim().length === 0) {
          violations.push({
            domain,
            locale,
            key,
            type: 'EMPTY_VALUE',
            message: `Domain "${domain}" [${locale}].${key} must not be empty or whitespace-only.`,
          });
          continue;
        }

        // Placeholder parity check
        const enVal = enDict[key] ?? '';
        const enPlaceholders = this.extractPlaceholders(enVal);
        const transPlaceholders = this.extractPlaceholders(transVal);

        // Every placeholder found in English must exist in the translated string
        for (const placeholder of enPlaceholders) {
          if (!transPlaceholders.includes(placeholder)) {
            violations.push({
              domain,
              locale,
              key,
              type: 'PLACEHOLDER_MISMATCH',
              message: `Domain "${domain}" [${locale}].${key} is missing placeholder "{${placeholder}}" present in English ("${enVal}"). Found translation: "${transVal}".`,
            });
          }
        }

        // Translation must not introduce unauthorized placeholders not in English
        for (const placeholder of transPlaceholders) {
          if (!enPlaceholders.includes(placeholder)) {
            violations.push({
              domain,
              locale,
              key,
              type: 'PLACEHOLDER_MISMATCH',
              message: `Domain "${domain}" [${locale}].${key} contains unexpected placeholder "{${placeholder}}" not in English ("${enVal}"). Found translation: "${transVal}".`,
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Audits all 12 domain JSON files in the dictionaries directory.
   */
  public static auditAllDomainDictionaries(dictionariesDir: string): I18nViolation[] {
    const violations: I18nViolation[] = [];

    for (const domain of EXPECTED_DOMAINS) {
      const filePath = path.join(dictionariesDir, `${domain}.json`);
      if (!fs.existsSync(filePath)) {
        violations.push({
          domain,
          type: 'MISSING_FILE',
          message: `Expected domain dictionary file does not exist: ${filePath}`,
        });
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        const domainViolations = this.auditDomainDictionary(domain, data);
        violations.push(...domainViolations);
      } catch (err: unknown) {
        violations.push({
          domain,
          type: 'MISSING_FILE',
          message: `Failed to read or parse domain dictionary file "${filePath}": ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return violations;
  }

  /**
   * Audits contract synchronization between Rust Locale enum and TypeScript Locale.ts binding.
   */
  public static auditLocaleContract(
    localeTsPath: string,
    rustLocalePath: string
  ): I18nViolation[] {
    const violations: I18nViolation[] = [];

    if (!fs.existsSync(localeTsPath)) {
      violations.push({
        type: 'MISSING_FILE',
        message: `Generated binding file not found at ${localeTsPath}`,
      });
      return violations;
    }

    if (!fs.existsSync(rustLocalePath)) {
      violations.push({
        type: 'MISSING_FILE',
        message: `Rust source file not found at ${rustLocalePath}`,
      });
      return violations;
    }

    const tsContent = fs.readFileSync(localeTsPath, 'utf-8');
    const rustContent = fs.readFileSync(rustLocalePath, 'utf-8');

    // 1. Guardrail against manual tampering: must contain ts-rs banner
    const tsRsBanner = '// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.';
    if (!tsContent.includes(tsRsBanner)) {
      violations.push({
        type: 'TAMPERED_BINDING',
        message: `src/bindings/Locale.ts is missing the canonical ts-rs generator banner comment: "${tsRsBanner}"`,
      });
    }

    // 2. Extract union string literals from TypeScript binding
    // Matches: export type Locale = "pl" | "en" | ... ;
    const typeMatch = tsContent.match(/export\s+type\s+Locale\s*=\s*([^;]+);/);
    if (!typeMatch) {
      violations.push({
        type: 'CONTRACT_DRIFT',
        message: `Could not parse "export type Locale" definition in ${localeTsPath}`,
      });
      return violations;
    }

    const rawUnion = typeMatch[1];
    const tsVariants = [...rawUnion.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

    // Check that Locale.ts contains all 10 supported locales plus 'custom' and 'system'
    for (const expected of CONTRACT_ALL_LOCALES) {
      if (!tsVariants.includes(expected)) {
        violations.push({
          type: 'CONTRACT_DRIFT',
          message: `Locale.ts is missing expected variant "${expected}". Found variants: [${tsVariants.join(', ')}]`,
        });
      }
    }

    for (const variant of tsVariants) {
      if (!CONTRACT_ALL_LOCALES.includes(variant as ContractLocale)) {
        violations.push({
          type: 'CONTRACT_DRIFT',
          message: `Locale.ts contains unexpected variant "${variant}" not in contract.`,
        });
      }
    }

    // 3. Extract variants from Rust enum in locale.rs
    const enumBlockMatch = rustContent.match(/pub\s+enum\s+Locale\s*\{([\s\S]*?)\}/);
    if (!enumBlockMatch) {
      violations.push({
        type: 'CONTRACT_DRIFT',
        message: `Could not parse "pub enum Locale" block in ${rustLocalePath}`,
      });
      return violations;
    }

    const enumBody = enumBlockMatch[1];
    const lines = enumBody.split('\n');
    const rustVariants: string[] = [];
    let pendingTsRename: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      const renameMatch = trimmed.match(/#\[ts\(rename\s*=\s*"([^"]+)"\)\]/);
      if (renameMatch) {
        pendingTsRename = renameMatch[1];
        continue;
      }

      // Check variant line e.g. "Pl," or "PtBr,"
      const variantMatch = trimmed.match(/^([A-Z][a-zA-Z0-9]*)\s*,?$/);
      if (variantMatch) {
        if (pendingTsRename) {
          rustVariants.push(pendingTsRename);
          pendingTsRename = null;
        } else {
          // Default ts-rs serde lowercase rename
          rustVariants.push(variantMatch[1].toLowerCase());
        }
      }
    }

    // Compare Rust-derived variants with TypeScript variants
    if (rustVariants.length !== tsVariants.length) {
      violations.push({
        type: 'CONTRACT_DRIFT',
        message: `Variant count mismatch between Rust enum (${rustVariants.length}) and TypeScript Locale.ts (${tsVariants.length}). Rust: [${rustVariants.join(', ')}], TS: [${tsVariants.join(', ')}]`,
      });
    }

    for (const rv of rustVariants) {
      if (!tsVariants.includes(rv)) {
        violations.push({
          type: 'CONTRACT_DRIFT',
          message: `Rust variant "${rv}" missing from TypeScript Locale.ts`,
        });
      }
    }

    for (const tv of tsVariants) {
      if (!rustVariants.includes(tv)) {
        violations.push({
          type: 'CONTRACT_DRIFT',
          message: `TypeScript variant "${tv}" in Locale.ts has no matching Rust variant`,
        });
      }
    }

    return violations;
  }
}

/**
 * Architecture Rule implementation for repository verification pipelines.
 */
export class I18nQualityRule implements ArchitectureRule {
  public readonly name = 'i18n-quality-gates-and-contract-guardrails';
  public readonly description =
    'Enforces 100% dictionary completeness, placeholder parity, and strict sync between Rust Locale and TypeScript bindings.';

  public check(_graph: ModuleGraph): RuleViolation[] {
    const rootDir = process.cwd();
    const dictionariesDir = path.resolve(rootDir, 'src/common/i18n/dictionaries');
    const bindingsPath = path.resolve(rootDir, 'src/bindings/Locale.ts');
    const rustLocalePath = path.resolve(rootDir, 'src-tauri/src/types/locale.rs');

    const dictionaryViolations = I18nQualityAuditor.auditAllDomainDictionaries(dictionariesDir);
    const contractViolations = I18nQualityAuditor.auditLocaleContract(bindingsPath, rustLocalePath);

    const allViolations: RuleViolation[] = [];

    for (const v of dictionaryViolations) {
      allViolations.push({
        file: v.domain ? `src/common/i18n/dictionaries/${v.domain}.json` : 'src/common/i18n/dictionaries',
        rule: this.name,
        message: `[${v.type}] ${v.message}`,
        target: v.key,
      });
    }

    for (const v of contractViolations) {
      allViolations.push({
        file: 'src/bindings/Locale.ts',
        rule: this.name,
        message: `[${v.type}] ${v.message}`,
      });
    }

    return allViolations;
  }
}
