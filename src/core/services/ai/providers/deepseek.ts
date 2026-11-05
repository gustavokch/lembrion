/**
 * DeepSeek Provider Implementation
 */

import { AIRequest, AIResponse } from '../../../types/ai.types';
import { createAIError, createHTTPError, toAIError } from '../errors';

export class DeepSeekProvider {
  private baseUrl = 'https://api.deepseek.com/v1';

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!request.apiKey) {
      throw createAIError('deepseek', 'API key is required for DeepSeek', 'MISSING_API_KEY');
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
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        throw await createHTTPError('deepseek', 'DeepSeek', response);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw createAIError('deepseek', 'Invalid response format from DeepSeek', 'INVALID_RESPONSE');
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
      throw toAIError(error, 'deepseek');
    }
  }
}
