/**
 * Request pieces shared by the provider clients
 */

import { AIError, AIMessage, AIProvider } from '../../../types/ai.types';
import { createAIError, toAIError } from '../errors';

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * The request URL for `path` under `baseUrl`. A full endpoint URL pasted as the base URL
 * (".../v1/messages") is used as is instead of becoming ".../v1/messages/messages".
 */
export function endpointUrl(baseUrl: string, path: string): string {
  const base = baseUrl.trim().replace(/\/+$/, '');
  return base.endsWith(path) ? base : base + path;
}

/**
 * The system messages joined into one instruction text, and the other turns. APIs with a
 * separate system field reject a request without turns, so a system-only request becomes
 * a single user turn.
 */
export function splitSystem(messages: AIMessage[]): { system: string; turns: Turn[] } {
  const system = messages
    .filter(message => message.role === 'system')
    .map(message => message.content)
    .join('\n')
    .trim();
  const turns = messages.flatMap(message =>
    message.role === 'system' ? [] : [{ role: message.role, content: message.content }]
  );
  return turns.length > 0 ? { system, turns } : { system: '', turns: [{ role: 'user', content: system }] };
}

/**
 * The header that carries the API key. User-run servers get a bearer token: vLLM reads only
 * that, and Ollama's CORS preflight rejects `x-api-key`. Without a key, no header is sent.
 */
export function apiKeyHeaders(apiKey: string | undefined, header: 'x-api-key' | 'bearer'): Record<string, string> {
  if (!apiKey) return {};
  return header === 'x-api-key' ? { 'x-api-key': apiKey } : { Authorization: `Bearer ${apiKey}` };
}

/**
 * Answer text without the model's reasoning. A server without a reasoning parser returns it
 * inline before the answer, as "<think>…</think>", or with the opening tag left in the prompt.
 */
export function stripThinking(text: string): string {
  return text.replace(/^\s*(?:<think>)?[\s\S]*?<\/think>\s*/, '');
}

/**
 * Like toAIError, but for a user-run server: fetch rejects with a TypeError when the
 * server is down, the URL is wrong or its CORS settings block this page, and the
 * message for that names the server rather than the internet connection.
 */
export function toClientError(error: unknown, provider: AIProvider, userRun: boolean): AIError {
  if (userRun && error instanceof TypeError) {
    return createAIError(provider, `Cannot reach the server: ${error.message}`, 'CONNECTION_ERROR', undefined, true);
  }
  return toAIError(error, provider);
}
