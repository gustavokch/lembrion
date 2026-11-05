import { AI_PROVIDER_IDS, AIProvider, MultiProviderSettings, ProviderSettings } from '../types/ai.types';

export const DEFAULT_MULTI_PROVIDER_SETTINGS: MultiProviderSettings = {
  currentProvider: 'openai',
  providers: {
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    gemini: { apiKey: '', model: 'gemini-1.5-flash' },
    anthropic: { apiKey: '', model: 'claude-3-haiku-20240307' },
    deepseek: { apiKey: '', model: 'deepseek-chat' },
    ollama: { apiKey: '', model: 'llama3.1:8b', baseUrl: 'http://localhost:11434/v1' },
  },
};

export function isAIProvider(value: unknown): value is AIProvider {
  return typeof value === 'string' && (AI_PROVIDER_IDS as readonly string[]).includes(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Coerce stored settings into the current shape. Providers that no longer exist
 * (such as the removed 'browser') are dropped, providers added after the data was
 * saved get their defaults, and an unknown current provider falls back to the default.
 */
export function normalizeMultiProviderSettings(value: unknown): MultiProviderSettings {
  const raw = isObject(value) ? value : {};
  const storedProviders = isObject(raw.providers) ? raw.providers : {};

  const providers = {} as Record<AIProvider, ProviderSettings>;
  for (const id of AI_PROVIDER_IDS) {
    const stored = storedProviders[id];
    providers[id] = {
      ...DEFAULT_MULTI_PROVIDER_SETTINGS.providers[id],
      ...(isObject(stored) ? (stored as Partial<ProviderSettings>) : {}),
    };
  }

  return {
    currentProvider: isAIProvider(raw.currentProvider)
      ? raw.currentProvider
      : DEFAULT_MULTI_PROVIDER_SETTINGS.currentProvider,
    providers,
  };
}
