/**
 * OpenAI Responses API client (POST {base}/responses): OpenAI's hosted API, or any
 * server that implements it
 */

import { AIProvider, AIRequest, AIResponse } from '../../../types/ai.types';
import { createAIError, createHTTPError } from '../errors';
import { apiKeyHeaders, endpointUrl, splitSystem, stripThinking, toClientError } from './common';

export interface ResponsesClientOptions {
  provider: AIProvider;
  /** English name for development messages */
  name: string;
  /** Hosted API root. Without it, each request carries the base URL of a user-run server. */
  hostedBaseUrl?: string;
}

interface OutputItem {
  type?: unknown;
  content?: unknown;
}

interface OutputPart {
  type?: unknown;
  text?: unknown;
}

export class ResponsesClient {
  constructor(private readonly options: ResponsesClientOptions) {}

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

      const response = await fetch(endpointUrl(baseUrl, '/responses'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...apiKeyHeaders(request.apiKey, 'bearer'),
          ...request.customHeaders,
        },
        // Stateless: store=false keeps OpenAI from keeping the exchange, and OpenRouter rejects store=true
        body: JSON.stringify({
          model: request.model,
          ...(system ? { instructions: system } : {}),
          input: turns,
          max_output_tokens: request.maxTokens,
          store: false,
          ...(request.effort === 'default' ? {} : { reasoning: { effort: request.effort } }),
        }),
      });

      if (!response.ok) {
        throw await createHTTPError(provider, name, response);
      }

      const data = await response.json();

      // Reasoning items can come before the message, so the text is read by item and part type
      const items: OutputItem[] = Array.isArray(data?.output) ? data.output : [];
      const parts = items.flatMap(item =>
        item.type === 'message' && Array.isArray(item.content) ? (item.content as OutputPart[]) : []
      );
      const text = parts
        .flatMap(part => (part.type === 'output_text' && typeof part.text === 'string' ? [part.text] : []))
        .join('');
      const content = hostedBaseUrl ? text : stripThinking(text);

      if (!content.trim() && parts.some(part => part.type === 'refusal')) {
        throw createAIError(provider, `${name} declined the request`, 'REFUSED');
      }
      if (!content.trim()) {
        const reason = data?.incomplete_details?.reason ?? data?.status;
        throw createAIError(provider, `No text in the ${name} response (${reason})`, 'INVALID_RESPONSE', undefined, true);
      }

      return {
        content,
        usage: data.usage
          ? {
              promptTokens: data.usage.input_tokens ?? 0,
              completionTokens: data.usage.output_tokens ?? 0,
              totalTokens: data.usage.total_tokens ?? 0,
            }
          : undefined,
        model: data.model,
        finishReason: data.incomplete_details?.reason ?? data.status,
      };
    } catch (error) {
      throw toClientError(error, provider, !hostedBaseUrl);
    }
  }
}
