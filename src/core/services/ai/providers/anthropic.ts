/**
 * Anthropic Claude Provider Implementation
 */

import { AIRequest, AIResponse } from '../../../types/ai.types';
import { createAIError, createHTTPError, toAIError } from '../errors';

export class AnthropicProvider {
  private baseUrl = 'https://api.anthropic.com/v1';

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!request.apiKey) {
      throw createAIError('anthropic', 'API key is required for Anthropic', 'MISSING_API_KEY');
    }

    try {
      const { system, messages } = this.convertMessagesToAnthropicFormat(request.messages);
      
      const response = await fetch(`${request.baseUrl || this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': request.apiKey,
          'anthropic-version': '2023-06-01',
          // Required for CORS: the browser calls the API directly with the user's key
          'anthropic-dangerous-direct-browser-access': 'true',
          ...request.customHeaders,
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: request.maxTokens ?? 800,
          temperature: request.temperature ?? 0.7,
          ...(system ? { system } : {}),
          messages,
        }),
      });

      if (!response.ok) {
        throw await createHTTPError('anthropic', 'Anthropic', response);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw createAIError('anthropic', 'Invalid response format from Anthropic', 'INVALID_RESPONSE');
      }

      return {
        content: data.content[0].text,
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        } : undefined,
        model: data.model,
        finishReason: data.stop_reason,
      };
    } catch (error) {
      throw toAIError(error, 'anthropic');
    }
  }

  /**
   * System messages go to the top-level `system` field. The Messages API rejects an empty
   * `messages` array, so a system-only request is sent as a single user message.
   */
  private convertMessagesToAnthropicFormat(messages: AIRequest['messages']) {
    const systemParts: string[] = [];
    const anthropicMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    
    for (const message of messages) {
      if (message.role === 'system') {
        systemParts.push(message.content);
      } else {
        anthropicMessages.push({
          role: message.role,
          content: message.content,
        });
      }
    }

    const system = systemParts.join('\n').trim();
    if (anthropicMessages.length === 0) {
      return { system: '', messages: [{ role: 'user' as const, content: system }] };
    }
    
    return { system, messages: anthropicMessages };
  }
}
