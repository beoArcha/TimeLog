export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

export type DomainTranslations = Record<string, Record<string, string>>;
