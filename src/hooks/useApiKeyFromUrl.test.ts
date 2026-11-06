import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../core/config/constants';
import { detectProviderFromApiKey, processApiKeyFromUrl } from './useApiKeyFromUrl';

const ANTHROPIC_KEY = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789';
const OPENAI_KEY = 'sk-proj-abcdefghijklmnopqrstuvwxyz0123456789';

function stored(key: string): unknown {
  const raw = window.localStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
}

function openUrl(search: string): void {
  window.history.replaceState(null, '', `/study${search}`);
}

describe('detectProviderFromApiKey', () => {
  it('maps key prefixes to providers', () => {
    expect(detectProviderFromApiKey(ANTHROPIC_KEY)).toBe('anthropic');
    expect(detectProviderFromApiKey(OPENAI_KEY)).toBe('openai');
    expect(detectProviderFromApiKey('AIzaSyabcdefghijklmnopqrstuvwxyz012345')).toBe('gemini');
    expect(detectProviderFromApiKey('AQ.Ab8RN6Kabcdefghijklmnopqrstuvwxyz012345')).toBe('gemini');
  });
});

describe('processApiKeyFromUrl', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores an sk-ant- key under anthropic and removes only the key params from the URL', () => {
    openUrl(`?apikey=${ANTHROPIC_KEY}&ref=newsletter`);

    processApiKeyFromUrl();

    const settings = stored(STORAGE_KEYS.MULTI_PROVIDER_SETTINGS) as {
      currentProvider: string;
      providers: Record<string, { apiKey: string }>;
    };
    expect(settings.currentProvider).toBe('anthropic');
    expect(settings.providers.anthropic.apiKey).toBe(ANTHROPIC_KEY);
    expect(settings.providers.openai.apiKey).toBe('');
    expect(stored(STORAGE_KEYS.API_KEY_FROM_URL)).toMatchObject({ provider: 'anthropic' });
    expect(window.location.search).toBe('?ref=newsletter');
  });

  it('rejects an unknown provider= value: stores no key, sets the error flag, cleans the URL', () => {
    openUrl(`?apikey=${OPENAI_KEY}&provider=openia`);

    processApiKeyFromUrl();

    expect(window.localStorage.getItem(STORAGE_KEYS.MULTI_PROVIDER_SETTINGS)).toBeNull();
    expect(stored(STORAGE_KEYS.API_KEY_ERROR)).toMatchObject({ reason: 'unknownProvider', provider: 'openia' });
    expect(window.location.search).toBe('');
  });
});
