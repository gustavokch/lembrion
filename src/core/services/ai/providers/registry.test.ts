import { describe, expect, it } from 'vitest';
import { AI_PROVIDER_IDS } from '../../../types/ai.types';
import { getModel, validateProviderConfig } from './registry';

describe('validateProviderConfig model ids', () => {
  it.each(AI_PROVIDER_IDS)('accepts a custom model id for %s', provider => {
    const result = validateProviderConfig(provider, { apiKey: 'test-key', model: 'my-fine-tune:2026' });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it.each(AI_PROVIDER_IDS)('rejects an empty model id for %s', provider => {
    expect(validateProviderConfig(provider, { apiKey: 'test-key', model: '' }).valid).toBe(false);
    expect(validateProviderConfig(provider, { apiKey: 'test-key', model: '   ' }).valid).toBe(false);
    expect(validateProviderConfig(provider, { apiKey: 'test-key' }).valid).toBe(false);
  });

  it('localizes the missing-model error', () => {
    expect(validateProviderConfig('openai', { apiKey: 'k', model: '' }, 'en-US').errors).toEqual(['Model is required']);
    expect(validateProviderConfig('openai', { apiKey: 'k', model: '' }, 'pt-BR').errors).toEqual(['Modelo é obrigatório']);
  });

  it('keeps returning undefined from getModel for ids outside the registry', () => {
    expect(getModel('openai', 'my-fine-tune:2026')).toBeUndefined();
    expect(getModel('openai', 'gpt-4o-mini')?.id).toBe('gpt-4o-mini');
  });
});
