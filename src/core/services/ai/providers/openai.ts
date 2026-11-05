/**
 * OpenAI Provider Implementation
 */

import { AIRequest, AIResponse } from '../../../types/ai.types';
import { createAIError, createHTTPError, toAIError } from '../errors';

export class OpenAIProvider {
  private baseUrl = 'https://api.openai.com/v1';

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!request.apiKey) {
      throw createAIError('openai', 'API key is required for OpenAI', 'MISSING_API_KEY');
    }

    try {
      const response = await fetch(`${request.baseUrl || this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.apiKey}`,
          ...request.customHeaders,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 800,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        throw await createHTTPError('openai', 'OpenAI', response);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw createAIError('openai', 'Invalid response format from OpenAI', 'INVALID_RESPONSE');
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
        model: data.model,
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error) {
      throw toAIError(error, 'openai');
    }
  }
}
