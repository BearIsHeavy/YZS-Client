/**
 * i18n - Internationalization Module
 * 
 * Provides translation functionality for the YanZhuShou application.
 * Supports English and Chinese with easy extension for more languages.
 * 
 * Usage:
 *   import { useI18n } from '@/i18n';
 *   const { t, locale, setLocale } = useI18n();
 *   const translatedText = t('nav.profile');
 */

import { ref, computed } from 'vue';
import en from './locales/en';
import zh from './locales/zh';

// Type definitions
export type Locale = 'en' | 'zh';
export type TranslationKey = string;

// Translation messages type
type TranslationMessages = typeof en;

// Available locales
export const availableLocales: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

// Default locale
const DEFAULT_LOCALE: Locale = 'en';

// Translation messages
const messages: Record<Locale, TranslationMessages> = {
  en,
  zh,
};

// Get initial locale
function getInitialLocale(): Locale {
  // Try to get saved locale from localStorage
  const saved = localStorage.getItem('locale') as Locale | null;
  if (saved && messages[saved]) {
    return saved;
  }
  // Try to detect browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  return DEFAULT_LOCALE;
}

// Current locale (reactive)
const currentLocale = ref<Locale>(getInitialLocale());

// Get nested value from object using dot notation
function getNestedValue(obj: TranslationMessages | Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Composable function to use i18n in Vue components
 * 
 * @returns Object with translation function, current locale, and locale setter
 */
export function useI18n() {
  /**
   * Translate a key to the current locale
   * @param key - Translation key (e.g., 'nav.profile')
   * @param fallback - Fallback value if translation not found
   * @returns Translated string or fallback
   */
  const t = (key: TranslationKey, fallback?: string): string => {
    const value = getNestedValue(messages[currentLocale.value], key);
    if (typeof value === 'string') {
      return value;
    }
    // Fallback to English if translation not found
    if (currentLocale.value !== 'en') {
      const enValue = getNestedValue(messages.en, key);
      if (typeof enValue === 'string') {
        return enValue;
      }
    }
    // Return fallback or key itself
    return fallback ?? key;
  };

  /**
   * Current locale
   */
  const locale = computed(() => currentLocale.value);

  /**
   * Set the current locale
   * @param newLocale - New locale code ('en' or 'zh')
   */
  const setLocale = (newLocale: Locale): void => {
    if (messages[newLocale]) {
      currentLocale.value = newLocale;
      localStorage.setItem('locale', newLocale);
      // Update document lang attribute for accessibility
      document.documentElement.lang = newLocale;
    }
  };

  /**
   * Get all available locales
   */
  const locales = computed(() => availableLocales);

  return {
    t,
    locale,
    setLocale,
    locales,
  };
}

/**
 * Get the current locale
 */
export function getCurrentLocale(): Locale {
  return currentLocale.value;
}

/**
 * Set the current locale (non-reactive, for use outside Vue components)
 */
export function setLocale(newLocale: Locale): void {
  if (messages[newLocale]) {
    currentLocale.value = newLocale;
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  }
}

/**
 * Translate a key (non-reactive, for use outside Vue components)
 */
export function translate(key: TranslationKey, fallback?: string): string {
  const value = getNestedValue(messages[currentLocale.value], key);
  if (typeof value === 'string') {
    return value;
  }
  if (currentLocale.value !== 'en') {
    const enValue = getNestedValue(messages.en, key);
    if (typeof enValue === 'string') {
      return enValue;
    }
  }
  return fallback ?? key;
}

// Export types
export type { TranslationMessages };
