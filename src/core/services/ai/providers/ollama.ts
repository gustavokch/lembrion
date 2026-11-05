/**
 * Ollama Provider Implementation
 */

import { AIRequest, AIResponse } from '../../../types/ai.types';
import { createAIError, createHTTPError, toAIError } from '../errors';

export class OllamaProvider {
  private baseUrl = 'http://localhost:11434/v1';

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await fetch(`${request.baseUrl || this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...request.customHeaders,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 800,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw await createHTTPError('ollama', 'Ollama', response);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw createAIError('ollama', 'Invalid response format from Ollama', 'INVALID_RESPONSE');
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens || 0,
          completionTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        } : undefined,
        model: data.model || request.model,
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error) {
      // fetch rejects with a TypeError when the server is down or blocks the origin
      if (error instanceof TypeError) {
        throw createAIError(
          'ollama',
          'Cannot connect to Ollama. Make sure Ollama is running and accessible.',
          'CONNECTION_ERROR',
          undefined,
          true
        );
      }

      throw toAIError(error, 'ollama');
    }
  }
}
