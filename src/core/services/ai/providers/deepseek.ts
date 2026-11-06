/**
 * DeepSeek client (Chat Completions)
 */

import { AIRequest, AIResponse, EffortLevel } from '../../../types/ai.types';
import { createAIError, createHTTPError, toAIError } from '../errors';

/** DeepSeek thinks unless told not to; 'none' turns thinking off, other levels set its effort */
function thinkingFields(effort: EffortLevel): Record<string, unknown> {
  if (effort === 'default') return {};
  if (effort === 'none') return { thinking: { type: 'disabled' } };
  return { thinking: { type: 'enabled' }, reasoning_effort: effort };
}

export class DeepSeekClient {
  private baseUrl = 'https://api.deepseek.com';

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
          max_tokens: request.maxTokens,
          ...thinkingFields(request.effort),
        }),
      });

      if (!response.ok) {
        throw await createHTTPError('deepseek', 'DeepSeek', response);
      }

      const data = await response.json();
      const choice = Array.isArray(data?.choices) ? data.choices[0] : undefined;

      if (choice?.finish_reason === 'content_filter') {
        throw createAIError('deepseek', 'DeepSeek filtered the answer', 'REFUSED');
      }
      if (typeof choice?.message?.content !== 'string' || !choice.message.content.trim()) {
        throw createAIError('deepseek', `No text in the DeepSeek response (${choice?.finish_reason})`, 'INVALID_RESPONSE', undefined, true);
      }

      return {
        content: choice.message.content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
        model: data.model,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      throw toAIError(error, 'deepseek');
    }
  }
}
