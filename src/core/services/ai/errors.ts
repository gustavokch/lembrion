/**
 * AIError construction shared by the service and the providers, and the localized text
 * the UI shows for them
 */

import { AIError, AIProvider } from '../../types/ai.types';
import { Translations } from '../../types/language.types';
import { debugLog } from './debug';

export function createAIError(
  provider: AIProvider,
  message: string,
  code?: string,
  statusCode?: number,
  retryable = false,
  detail?: string
): AIError {
  const error = new Error(message) as AIError;
  error.name = 'AIError';
  error.provider = provider;
  error.code = code;
  error.statusCode = statusCode;
  error.retryable = retryable;
  error.detail = detail;
  return error;
}

/**
 * Build the AIError for a non-2xx provider response. The provider's own error message
 * from the body becomes `detail`, which the UI shows untranslated after a localized lead.
 */
export async function createHTTPError(
  provider: AIProvider,
  providerName: string,
  response: Response
): Promise<AIError> {
  const body = await response.json().catch(() => ({}));
  const bodyMessage: unknown = body?.error?.message;
  const detail = typeof bodyMessage === 'string' && bodyMessage.trim() ? bodyMessage.trim() : undefined;
  return createAIError(
    provider,
    `${providerName} API error: ${response.status} ${response.statusText}${detail ? `. ${detail}` : ''}`,
    'API_ERROR',
    response.status,
    false,
    detail
  );
}

export function isAIError(error: unknown): error is AIError {
  return error instanceof Error && error.name === 'AIError';
}

/**
 * Pass AIErrors through unchanged and wrap anything else. Only transient failures are
 * retryable: fetch rejects with a TypeError when the network fails, and
 * AbortSignal.timeout() aborts with a TimeoutError.
 */
export function toAIError(error: unknown, provider: AIProvider): AIError {
  if (isAIError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (error instanceof TypeError) {
    return createAIError(provider, `Network error: ${message}`, 'NETWORK_ERROR', undefined, true);
  }

  if (error instanceof Error && error.name === 'TimeoutError') {
    return createAIError(provider, `Request timed out: ${message}`, 'TIMEOUT', undefined, true);
  }

  return createAIError(provider, message || 'Unknown AI service error', 'UNKNOWN_ERROR');
}

function localizedLead(error: AIError, t: Translations): string {
  if (error.statusCode === 401 || error.statusCode === 403) return t.aiErrorInvalidApiKey;
  if (error.statusCode === 429) return t.aiErrorRateLimited;

  switch (error.code) {
    case 'MISSING_API_KEY':
      return t.aiErrorMissingApiKey;
    case 'MISSING_CONTEXT':
      return t.aiErrorMissingContext;
    case 'INVALID_CONFIG':
      return t.aiErrorInvalidConfig;
    case 'INVALID_RESPONSE':
      return t.aiErrorInvalidResponse;
    case 'NETWORK_ERROR':
      return t.aiErrorNetwork;
    case 'CONNECTION_ERROR':
      return t.aiErrorOllamaConnection;
    case 'TIMEOUT':
      return t.aiErrorTimeout;
    case 'API_ERROR':
      return t.aiErrorProvider;
    default:
      return t.aiErrorUnknown;
  }
}

/**
 * Localized, user-facing text for an error thrown by the AI service. Provider-supplied
 * detail cannot be translated, so it follows the localized lead as-is. The English
 * technical message goes to the development log only.
 */
export function getAIErrorMessage(error: unknown, t: Translations): string {
  if (!isAIError(error)) {
    debugLog('Non-AI error from the AI service:', error);
    return t.aiErrorUnknown;
  }

  debugLog('AI error:', { code: error.code, statusCode: error.statusCode, message: error.message });
  const lead = localizedLead(error, t);
  return error.detail ? `${lead} (${error.detail})` : lead;
}
