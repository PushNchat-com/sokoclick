/**
 * Translation content type that enforces bilingual text content
 */
export interface TranslationContent {
  en: string;
  fr: string;
}

/**
 * Translation function type
 */
export type TranslationFunction = (content: TranslationContent) => string;

/**
 * Language type
 */
export type Language = 'en' | 'fr';

/**
 * Language context type
 */
export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: TranslationFunction;
}

/**
 * Translation map type for organizing translations by section
 */
export interface TranslationMap {
  [key: string]: {
    [key: string]: TranslationContent;
  };
}

/**
 * Translation key type for strongly typed translation keys
 */
export type TranslationKey = keyof TranslationMap;

/**
 * Helper function to create a translation content object
 */
export const createTranslation = (en: string, fr: string): TranslationContent => ({
  en,
  fr,
}); 