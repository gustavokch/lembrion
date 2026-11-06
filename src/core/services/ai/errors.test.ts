import { describe, expect, it } from 'vitest';
import { enUS } from '../i18n/translations/en-US';
import { ptBR } from '../i18n/translations/pt-BR';
import { createAIError, createHTTPError, getAIErrorMessage, toAIError } from './errors';

function httpResponse(status: number, body: unknown): Response {
  return { ok: false, status, statusText: 'Error', json: async () => body } as Response;
}

describe('getAIErrorMessage', () => {
  it('localizes errors by code instead of showing the English message', () => {
    const error = createAIError('openai', 'API key is required for OpenAI', 'MISSING_API_KEY');
    expect(getAIErrorMessage(error, enUS)).toBe(enUS.aiErrorMissingApiKey);
    expect(getAIErrorMessage(error, ptBR)).toBe(ptBR.aiErrorMissingApiKey);
  });

  it('maps network failures and timeouts', () => {
    expect(getAIErrorMessage(toAIError(new TypeError('Failed to fetch'), 'openai'), ptBR)).toBe(ptBR.aiErrorNetwork);
    const timeout = new Error('signal timed out');
    timeout.name = 'TimeoutError';
    expect(getAIErrorMessage(toAIError(timeout, 'openai'), ptBR)).toBe(ptBR.aiErrorTimeout);
  });

  it.each([
    [401, 'aiErrorInvalidApiKey'],
    [403, 'aiErrorInvalidApiKey'],
    [429, 'aiErrorRateLimited'],
    [500, 'aiErrorProvider'],
  ] as const)('maps HTTP %i and appends the provider detail', async (status, key) => {
    const error = await createHTTPError('openai', 'OpenAI', httpResponse(status, { error: { message: 'Provider says no' } }));
    const message = getAIErrorMessage(error, ptBR);
    expect(message.startsWith(ptBR[key])).toBe(true);
    expect(message).toContain('Provider says no');
  });

  it('shows only the localized lead when the provider body has no message', async () => {
    const error = await createHTTPError('gemini', 'Gemini', httpResponse(503, 'not json'));
    expect(getAIErrorMessage(error, enUS)).toBe(enUS.aiErrorProvider);
  });

  it('appends a plain-string error body from a self-hosted server', async () => {
    const error = await createHTTPError('custom-responses', 'Server', httpResponse(404, { error: 'model "qwen9" not found' }));
    expect(getAIErrorMessage(error, enUS)).toBe(`${enUS.aiErrorProvider} (model "qwen9" not found)`);
  });

  it('names the server, not the internet connection, when a user-run server is unreachable', () => {
    const error = createAIError('custom-messages', 'Cannot reach the server', 'CONNECTION_ERROR');
    expect(getAIErrorMessage(error, ptBR)).toBe(ptBR.aiErrorEndpointConnection);
  });

  it('falls back to a localized generic message for unknown errors', () => {
    expect(getAIErrorMessage(new Error('Something internal'), ptBR)).toBe(ptBR.aiErrorUnknown);
    expect(getAIErrorMessage(toAIError('weird', 'openai'), ptBR)).toBe(ptBR.aiErrorUnknown);
  });
});
