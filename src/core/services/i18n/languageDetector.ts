import { Language, LanguageSettings } from '../../types';
import { SUPPORTED_LANGUAGES, DEFAULTS, STORAGE_KEYS } from '../../config/constants';
import * as storage from '../storage/localStorage';

/**
 * Check whether a value is one of the supported language codes
 */
export function isSupportedLanguage(value: unknown): value is Language {
  return typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value);
}

/**
 * Detect the browser's language and return the closest supported language
 */
export function detectBrowserLanguage(): Language {
  // Default language as fallback
  const defaultLanguage = DEFAULTS.LANGUAGE as Language;
  
  try {
    // Get browser language
    const browserLang = navigator.language || (navigator.languages && navigator.languages[0]);
    
    if (!browserLang) {
      return defaultLanguage;
    }
    
    // Check if the browser language is directly supported
    if (isSupportedLanguage(browserLang)) {
      return browserLang;
    }
    
    // Check for language prefix match (e.g., 'pt-PT' should match 'pt-BR')
    const prefix = browserLang.split('-')[0];
    
    for (const supportedLang of SUPPORTED_LANGUAGES) {
      if (supportedLang.startsWith(prefix)) {
        return supportedLang as Language;
      }
    }
    
    // No match found, return default
    return defaultLanguage;
  } catch (error) {
    console.error('Error detecting browser language:', error);
    return defaultLanguage;
  }
}

/**
 * The active language: the stored language setting (the one useLanguage writes),
 * or the browser language when none is stored. Usable outside React.
 */
export function getCurrentLanguage(): Language {
  const settings = storage.getItem<Partial<LanguageSettings> | null>(STORAGE_KEYS.LANGUAGE, null);
  return settings && isSupportedLanguage(settings.language) ? settings.language : detectBrowserLanguage();
}

/**
 * Apply a `?lang=<code>` URL parameter: a supported code becomes the persisted
 * language setting and the parameter is removed from the address bar (other
 * parameters stay). Unsupported values are ignored. Call before the first render.
 * Returns the applied language, or null.
 */
export function applyLanguageFromUrl(): Language | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const lang = url.searchParams.get('lang');
    if (!isSupportedLanguage(lang)) return null;

    const settings: LanguageSettings = { language: lang };
    storage.setItem(STORAGE_KEYS.LANGUAGE, settings);

    url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, document.title, url.toString());
    return lang;
  } catch (error) {
    console.error('Error applying language from URL:', error);
    return null;
  }
}

/**
 * Format a date according to the current language
 */
export function formatDate(date: string, language: Language): string {
  try {
    const dateObj = new Date(date);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return dateObj.toLocaleDateString(language, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date;
  }
}
