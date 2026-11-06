/**
 * Anthropic Messages API client (POST {base}/messages): Anthropic's hosted API, or any
 * server that implements it
 */

import { AIProvider, AIRequest, AIResponse, EffortLevel } from '../../../types/ai.types';
import { createAIError, createHTTPError } from '../errors';
import { apiKeyHeaders, endpointUrl, splitSystem, stripThinking, toClientError } from './common';

export interface MessagesClientOptions {
  provider: AIProvider;
  /** English name for development messages */
  name: string;
  /** Hosted API root. Without it, each request carries the base URL of a user-run server. */
  hostedBaseUrl?: string;
  /** Anthropic's own `x-api-key`, or the bearer token that compatible servers accept */
  keyHeader: 'x-api-key' | 'bearer';
  /** Headers this endpoint needs beyond the Messages API core */
  headers?: Record<string, string>;
}

interface ContentBlock {
  type?: unknown;
  text?: unknown;
}

/** 'none' turns thinking off; any other level is the effort, which also covers the answer text */
function effortFields(effort: EffortLevel): Record<string, unknown> {
  if (effort === 'default') return {};
  if (effort === 'none') return { thinking: { type: 'disabled' } };
  return { output_config: { effort } };
}

export class MessagesClient {
  constructor(private readonly options: MessagesClientOptions) {}

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const { provider, name, hostedBaseUrl } = this.options;
    const baseUrl = request.baseUrl || hostedBaseUrl;
    if (!baseUrl) {
      throw createAIError(provider, `A base URL is required for ${name}`, 'INVALID_CONFIG');
    }
    if (hostedBaseUrl && !request.apiKey) {
      throw createAIError(provider, `API key is required for ${name}`, 'MISSING_API_KEY');
    }

    try {
      const { system, turns } = splitSystem(request.messages);

      const response = await fetch(endpointUrl(baseUrl, '/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...apiKeyHeaders(request.apiKey, this.options.keyHeader),
          ...this.options.headers,
          ...request.customHeaders,
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.maxTokens,
          ...(system ? { system } : {}),
          messages: turns,
          ...effortFields(request.effort),
        }),
      });

      if (!response.ok) {
        throw await createHTTPError(provider, name, response);
      }

      const data = await response.json();

      if (data?.stop_reason === 'refusal') {
        throw createAIError(provider, `${name} declined the request`, 'REFUSED');
      }

      // Thinking blocks can come before the answer, so the text is read by block type
      const blocks: ContentBlock[] = Array.isArray(data?.content) ? data.content : [];
      const text = blocks
        .flatMap(block => (block.type === 'text' && typeof block.text === 'string' ? [block.text] : []))
        .join('');
      const content = hostedBaseUrl ? text : stripThinking(text);
      if (!content.trim()) {
        throw createAIError(provider, `No text in the ${name} response (stop reason: ${data?.stop_reason})`, 'INVALID_RESPONSE', undefined, true);
      }

      const inputTokens = data.usage?.input_tokens ?? 0;
      const outputTokens = data.usage?.output_tokens ?? 0;
      return {
        content,
        usage: data.usage
          ? { promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens }
          : undefined,
        model: data.model,
        finishReason: data.stop_reason,
      };
    } catch (error) {
      throw toClientError(error, provider, !hostedBaseUrl);
    }
  }
}
