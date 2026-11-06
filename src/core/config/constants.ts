/**
 * Application-wide constants
 */

// Current application version, injected from package.json by vite.config.ts `define`
export const APP_VERSION: string = __APP_VERSION__;

// Local storage keys. They keep the app's former name (Studorama) because renaming them would orphan existing users' data.
export const STORAGE_KEYS = {
  API_SETTINGS: 'studorama-api-settings',
  MULTI_PROVIDER_SETTINGS: 'studorama-multi-provider-settings',
  LANGUAGE: 'studorama-language',
  SESSIONS: 'studorama-sessions',
  THEME: 'studorama-theme',
  VERSION: 'studorama-app-version',
  API_KEY_FROM_URL: 'studorama-api-key-from-url',
  API_KEY_ERROR: 'studorama-api-key-error',
};

// Default values
export const DEFAULTS = {
  LANGUAGE: 'en-US',
  THEME: 'light',
  PRELOAD_QUESTIONS: 3,
  MODEL: 'gpt-4o-mini',
  SESSION_TIMER: 30, // minutes
  QUESTION_TIMER: 60 // seconds
};

// Supported languages
export const SUPPORTED_LANGUAGES = ['en-US', 'pt-BR'];

// Keys to preserve during version migration
export const PRESERVED_STORAGE_KEYS = [
  STORAGE_KEYS.API_SETTINGS,
  STORAGE_KEYS.MULTI_PROVIDER_SETTINGS,
  STORAGE_KEYS.LANGUAGE,
  STORAGE_KEYS.SESSIONS,
  STORAGE_KEYS.THEME,
  STORAGE_KEYS.VERSION,
  STORAGE_KEYS.API_KEY_FROM_URL,
  STORAGE_KEYS.API_KEY_ERROR,
];
