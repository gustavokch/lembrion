/**
 * Google Gemini client (generateContent)
 */

import { AIRequest, AIResponse } from '../../../types/ai.types';
import { createAIError, createHTTPError, toAIError } from '../errors';
import { splitSystem } from './common';

/** Finish reasons for an answer that a safety filter stopped */
const BLOCKED_FINISH_REASONS = ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII'];

interface Part {
  text?: unknown;
  thought?: unknown;
}

export class GeminiClient {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!request.apiKey) {
      throw createAIError('gemini', 'API key is required for Gemini', 'MISSING_API_KEY');
    }

    try {
      const { system, turns } = splitSystem(request.messages);

      // Google's CORS preflight rejects unrecognized headers (such as api-revision): add none here
      const response = await fetch(
        `${request.baseUrl || this.baseUrl}/models/${request.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': request.apiKey,
            ...request.customHeaders,
          },
          body: JSON.stringify({
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
            contents: turns.map(turn => ({
              role: turn.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: turn.content }],
            })),
            generationConfig: {
              // Thinking tokens count against this limit
              maxOutputTokens: request.maxTokens,
              ...(request.effort === 'default' ? {} : { thinkingConfig: { thinkingLevel: request.effort.toUpperCase() } }),
            },
            store: false,
          }),
        }
      );

      if (!response.ok) {
        throw await createHTTPError('gemini', 'Gemini', response);
      }

      const data = await response.json();
      const candidate = Array.isArray(data?.candidates) ? data.candidates[0] : undefined;

      if (!candidate) {
        if (data?.promptFeedback?.blockReason) {
          throw createAIError('gemini', `Gemini blocked the prompt: ${data.promptFeedback.blockReason}`, 'REFUSED');
        }
        throw createAIError('gemini', 'Invalid response format from Gemini', 'INVALID_RESPONSE', undefined, true);
      }

      const parts: Part[] = Array.isArray(candidate.content?.parts) ? candidate.content.parts : [];
      const content = parts
        .flatMap(part => (typeof part.text === 'string' && part.thought !== true ? [part.text] : []))
        .join('');

      if (!content.trim() && BLOCKED_FINISH_REASONS.includes(candidate.finishReason)) {
        throw createAIError('gemini', `Gemini stopped the answer: ${candidate.finishReason}`, 'REFUSED');
      }
      if (!content.trim()) {
        throw createAIError('gemini', `No text in the Gemini response (${candidate.finishReason})`, 'INVALID_RESPONSE', undefined, true);
      }

      return {
        content,
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount ?? 0,
              completionTokens: (data.usageMetadata.candidatesTokenCount ?? 0) + (data.usageMetadata.thoughtsTokenCount ?? 0),
              totalTokens: data.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
        model: request.model,
        finishReason: candidate.finishReason,
      };
    } catch (error) {
      throw toAIError(error, 'gemini');
    }
  }
}
