import { useEffect } from 'react';
import { DEFAULTS, STORAGE_KEYS } from '../core/config/constants';
import { isAIProvider, normalizeMultiProviderSettings } from '../core/config/providerSettings';
import { getProviderConfig, validateProviderConfig } from '../core/services/ai/providers/registry';
import { formatMessage } from '../core/services/i18n/formatMessage';
import { getCurrentLanguage } from '../core/services/i18n/languageDetector';
import { showNotification } from '../core/services/notification';
import * as localStorage from '../core/services/storage/localStorage';
import { APISettings, Translations } from '../core/types';
import { AI_PROVIDER_IDS, AIProvider, MultiProviderSettings } from '../core/types/ai.types';
import { useLanguage } from './useLanguage';
import { useLocalStorage } from './useLocalStorage';
import { useMultiProviderSettings } from './useMultiProviderSettings';

const URL_PARAMS = ['apikey', 'api_key', 'key', 'model', 'provider', 'baseUrl', 'base_url'];

/** Stored in STORAGE_KEYS.API_KEY_FROM_URL; read once by useApiKeyFromUrl to show a notice */
interface ApiKeySuccessFlag {
  provider: AIProvider;
  model: string;
  hasBaseUrl: boolean;
}

/** Stored in STORAGE_KEYS.API_KEY_ERROR; read once by useApiKeyFromUrl to show a notice */
type ApiKeyErrorFlag =
  | { reason: 'unknownProvider'; provider: string }
  | { reason: 'invalidFormat'; provider: AIProvider }
  | { reason: 'invalidConfig'; provider: AIProvider; errors: string[] };

const LEGACY_API_SETTINGS_DEFAULT: APISettings = {
  openaiApiKey: '',
  model: DEFAULTS.MODEL,
  customPrompts: {
    multipleChoice: '',
    dissertative: '',
    evaluation: '',
    elaborativePrompt: '',
    retrievalPrompt: ''
  },
  preloadQuestions: DEFAULTS.PRELOAD_QUESTIONS
};

/**
 * Read the API key parameters from the URL
 */
function extractApiKeyFromUrl(): {
  apiKey: string | null;
  model: string | null;
  provider: string | null;
  baseUrl: string | null;
} {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    apiKey: urlParams.get('apikey') || urlParams.get('api_key') || urlParams.get('key'),
    model: urlParams.get('model'),
    provider: urlParams.get('provider'),
    baseUrl: urlParams.get('baseUrl') || urlParams.get('base_url'),
  };
}

/**
 * Remove the API key parameters from the URL so the key does not stay in the
 * address bar or browser history. Other parameters stay.
 */
function cleanUrlParameters(): void {
  try {
    const cleanUrl = new URL(window.location.href);
    if (!URL_PARAMS.some(param => cleanUrl.searchParams.has(param))) return;

    URL_PARAMS.forEach(param => cleanUrl.searchParams.delete(param));
    window.history.replaceState(window.history.state, document.title, cleanUrl.toString());
  } catch (error) {
    console.error('Error cleaning URL parameters:', error);
  }
}

/**
 * Guess the provider from the API key prefix. DeepSeek keys also start with
 * `sk-` and cannot be told apart from OpenAI keys, so a plain `sk-` key maps to
 * OpenAI; DeepSeek links need `provider=deepseek`.
 */
export function detectProviderFromApiKey(apiKey: string): AIProvider {
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('AIza')) return 'gemini';
  return 'openai';
}

/**
 * Validate API key format for provider
 */
export function validateApiKeyFormat(apiKey: string, provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    case 'gemini':
      return apiKey.startsWith('AIza') && apiKey.length > 20;
    case 'anthropic':
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    case 'deepseek':
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    case 'ollama':
      return true; // Ollama does not require an API key
  }
}

function storeApiKey(apiKey: string, provider: AIProvider, model: string | null, baseUrl: string | null): void {
  const currentSettings = normalizeMultiProviderSettings(
    localStorage.getItem<unknown>(STORAGE_KEYS.MULTI_PROVIDER_SETTINGS, null)
  );
  const selectedModel = model || getProviderConfig(provider).defaultModel;

  const providerSettings = {
    ...currentSettings.providers[provider],
    apiKey,
    model: selectedModel,
    ...(baseUrl && { baseUrl })
  };

  const validation = validateProviderConfig(provider, providerSettings, getCurrentLanguage());
  if (!validation.valid) {
    console.warn(`Invalid ${provider.toUpperCase()} configuration:`, validation.errors);
    const errorFlag: ApiKeyErrorFlag = { reason: 'invalidConfig', provider, errors: validation.errors };
    localStorage.setItem(STORAGE_KEYS.API_KEY_ERROR, errorFlag);
    return;
  }

  const updatedSettings: MultiProviderSettings = {
    currentProvider: provider,
    providers: { ...currentSettings.providers, [provider]: providerSettings }
  };
  localStorage.setItem(STORAGE_KEYS.MULTI_PROVIDER_SETTINGS, updatedSettings);

  // Keep the legacy single-provider settings in sync for OpenAI
  if (provider === 'openai') {
    const legacySettings = localStorage.getItem<APISettings>(STORAGE_KEYS.API_SETTINGS, LEGACY_API_SETTINGS_DEFAULT);
    localStorage.setItem(STORAGE_KEYS.API_SETTINGS, { ...legacySettings, openaiApiKey: apiKey, model: selectedModel });
  }

  const successFlag: ApiKeySuccessFlag = { provider, model: selectedModel, hasBaseUrl: !!baseUrl };
  localStorage.setItem(STORAGE_KEYS.API_KEY_FROM_URL, successFlag);
  console.log(`${provider.toUpperCase()} API key extracted and stored from URL`);
}

/**
 * Store an API key passed as `?apikey=` (with optional `provider=`, `model=`,
 * `baseUrl=`) in the multi-provider settings, then remove those parameters from
 * the URL. Runs before the first render. Failures are stored as a flag that
 * useApiKeyFromUrl turns into a notification.
 */
export function processApiKeyFromUrl(): void {
  if (typeof window === 'undefined') return;

  try {
    const { apiKey, model, provider: providerParam, baseUrl } = extractApiKeyFromUrl();
    if (!apiKey) return;

    if (providerParam !== null && !isAIProvider(providerParam)) {
      console.warn(`Unknown provider "${providerParam}" in URL parameter`);
      const errorFlag: ApiKeyErrorFlag = { reason: 'unknownProvider', provider: providerParam };
      localStorage.setItem(STORAGE_KEYS.API_KEY_ERROR, errorFlag);
      return;
    }

    const provider = providerParam ?? detectProviderFromApiKey(apiKey);

    if (!validateApiKeyFormat(apiKey, provider)) {
      console.warn(`Invalid API key format for ${provider.toUpperCase()} in URL parameter`);
      const errorFlag: ApiKeyErrorFlag = { reason: 'invalidFormat', provider };
      localStorage.setItem(STORAGE_KEYS.API_KEY_ERROR, errorFlag);
      return;
    }

    storeApiKey(apiKey, provider, model, baseUrl);
  } catch (error) {
    console.error('Error storing API key from URL:', error);
  } finally {
    cleanUrlParameters();
  }
}

/**
 * Hook to extract and use API key from URL parameters
 * This now handles multi-provider settings and shows appropriate notifications
 */
export function useApiKeyFromUrl() {
  const [apiSettings] = useLocalStorage<APISettings>(STORAGE_KEYS.API_SETTINGS, LEGACY_API_SETTINGS_DEFAULT);
  const [multiProviderSettings] = useMultiProviderSettings();
  const { t } = useLanguage();

  useEffect(() => {
    const successData = localStorage.getItem<ApiKeySuccessFlag | null>(STORAGE_KEYS.API_KEY_FROM_URL, null);
    
    if (successData) {
      // Remove the flag immediately to prevent showing again
      localStorage.removeItem(STORAGE_KEYS.API_KEY_FROM_URL);

      // Small delay to ensure translations are loaded
      setTimeout(() => {
        const providerName = successData.provider?.toUpperCase() || 'AI';
        const modelInfo = successData.model ? ` ${t.usingModel} ${successData.model}` : '';
        const baseUrlInfo = successData.hasBaseUrl ? ' with custom base URL' : '';
        
        showNotification({
          type: 'success',
          title: t.apiKeyConfigured,
          message: `${providerName} ${t.apiKeyConfiguredDesc}.${modelInfo}${baseUrlInfo}`,
          duration: 6000,
        });
      }, 1000);
    }
    
    const errorData = localStorage.getItem<ApiKeyErrorFlag | null>(STORAGE_KEYS.API_KEY_ERROR, null);
    
    if (errorData) {
      // Remove the flag immediately to prevent showing again
      localStorage.removeItem(STORAGE_KEYS.API_KEY_ERROR);
      
      // Small delay to ensure translations are loaded
      setTimeout(() => {
        showNotification({
          type: 'error',
          title: t.invalidApiKey,
          message: describeApiKeyError(errorData, t),
          duration: 8000,
        });
      }, 1000);
    }
  }, [t]);

  // Determine if we have a valid API key for the current provider
  const currentProvider = multiProviderSettings.currentProvider;
  const currentProviderSettings = multiProviderSettings.providers[currentProvider];
  const providerConfig = getProviderConfig(currentProvider);
  
  // For providers that don't require API keys, consider them as "having" a key
  const hasApiKey = !providerConfig.requiresApiKey || !!currentProviderSettings.apiKey;
  
  return {
    // Legacy compatibility
    apiSettings,
    hasApiKey: hasApiKey,
    
    // Multi-provider support
    multiProviderSettings,
    currentProvider,
    currentProviderSettings,
    providerConfig
  };
}

function describeApiKeyError(error: ApiKeyErrorFlag, t: Translations): string {
  switch (error.reason) {
    case 'unknownProvider':
      return formatMessage(t.apiKeyUnknownProvider, {
        provider: error.provider,
        providers: AI_PROVIDER_IDS.join(', ')
      });
    case 'invalidFormat':
      return `${error.provider.toUpperCase()}: ${t.invalidApiKeyFormat}`;
    case 'invalidConfig':
      return `${error.provider.toUpperCase()}: ${error.errors.join(', ')}`;
    default:
      // Flag written by an older version in another shape
      return t.invalidApiKeyDesc;
  }
}
