import { describe, expect, it } from 'vitest';
import { AI_PROVIDER_IDS } from '../../../types/ai.types';
import { getMaxOutputTokens, getModel, getProviderConfig, resolveEffort, validateProviderConfig } from './registry';

describe('validateProviderConfig', () => {
  const complete = { apiKey: 'test-key', model: 'my-fine-tune:2026', baseUrl: 'http://localhost:11434/v1' };

  it.each(AI_PROVIDER_IDS)('accepts a custom model id for %s', provider => {
    expect(validateProviderConfig(provider, complete)).toEqual({ valid: true, errors: [] });
  });

  it.each(AI_PROVIDER_IDS)('rejects an empty model id for %s', provider => {
    expect(validateProviderConfig(provider, { ...complete, model: '' }).valid).toBe(false);
    expect(validateProviderConfig(provider, { ...complete, model: '   ' }).valid).toBe(false);
    expect(validateProviderConfig(provider, { apiKey: 'test-key', baseUrl: complete.baseUrl }).valid).toBe(false);
  });

  it('localizes the missing-model error', () => {
    expect(validateProviderConfig('openai', { apiKey: 'k', model: '' }, 'en-US').errors).toEqual(['Model is required']);
    expect(validateProviderConfig('openai', { apiKey: 'k', model: '' }, 'pt-BR').errors).toEqual(['Modelo é obrigatório']);
  });

  it.each(['custom-messages', 'custom-responses'] as const)('%s needs a base URL but no API key', provider => {
    expect(validateProviderConfig(provider, { model: 'qwen3', baseUrl: 'http://localhost:11434/v1' }).valid).toBe(true);
    expect(validateProviderConfig(provider, { model: 'qwen3', baseUrl: '  ' }).errors).toEqual(['Base URL is required']);
    expect(validateProviderConfig(provider, { model: 'qwen3' }).errors).toEqual(['Base URL is required']);
  });

  it.each(['localhost:11434/v1', 'ftp://example.com/v1', 'not a url'])('rejects the base URL %s', baseUrl => {
    expect(validateProviderConfig('custom-responses', { model: 'qwen3', baseUrl }).errors).toEqual(['Invalid base URL format']);
  });

  it('keeps returning undefined from getModel for ids outside the registry', () => {
    expect(getModel('openai', 'my-fine-tune:2026')).toBeUndefined();
    expect(getModel('openai', 'gpt-6-luna')?.id).toBe('gpt-6-luna');
  });
});

describe('effort levels', () => {
  it.each(AI_PROVIDER_IDS)('%s keeps an offered level and falls back to its default for any other', provider => {
    const { efforts, defaultEffort } = getProviderConfig(provider);
    expect(efforts).toContain(defaultEffort);
    for (const level of efforts) {
      expect(resolveEffort(provider, level)).toBe(level);
    }
    expect(resolveEffort(provider, undefined)).toBe(defaultEffort);
    expect(resolveEffort(provider, 'turbo')).toBe(defaultEffort);
  });

  it.each(AI_PROVIDER_IDS)('%s never gets less output room at a higher level, nor more than any hosted model allows', provider => {
    const limits = getProviderConfig(provider).efforts.map(level => getMaxOutputTokens(provider, level));
    expect(limits).toEqual([...limits].sort((a, b) => a - b));
    // Gemini's output limit, the lowest of the hosted models
    expect(Math.max(...limits)).toBeLessThanOrEqual(65536);
  });
});
