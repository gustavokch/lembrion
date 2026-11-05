/**
 * Google Gemini Provider Implementation
 */

import { AIRequest, AIResponse } from '../../../types/ai.types';
import { createAIError, createHTTPError, toAIError } from '../errors';

export class GeminiProvider {
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async generateCompletion(request: AIRequest): Promise<AIResponse> {
    if (!request.apiKey) {
      throw createAIError('gemini', 'API key is required for Gemini', 'MISSING_API_KEY');
    }

    try {
      const contents = this.convertMessagesToGeminiFormat(request.messages);
      
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
            contents,
            generationConfig: {
              temperature: request.temperature ?? 0.7,
              maxOutputTokens: request.maxTokens ?? 800,
              topP: 0.8,
              topK: 40,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ],
          }),
        }
      );

      if (!response.ok) {
        throw await createHTTPError('gemini', 'Gemini', response);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw createAIError('gemini', 'Invalid response format from Gemini', 'INVALID_RESPONSE');
      }

      const candidate = data.candidates[0];
      const content = candidate.content.parts?.[0]?.text || '';

      return {
        content,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        } : undefined,
        model: request.model,
        finishReason: candidate.finishReason,
      };
    } catch (error) {
      throw toAIError(error, 'gemini');
    }
  }

  /**
   * System text is prepended to the first user turn (older models such as gemini-pro reject
   * `systemInstruction`). Without a leading user turn, the system text becomes one.
   */
  private convertMessagesToGeminiFormat(messages: AIRequest['messages']) {
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    const systemParts: string[] = [];
    
    for (const message of messages) {
      if (message.role === 'system') {
        systemParts.push(message.content);
      } else {
        contents.push({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        });
      }
    }

    const systemInstruction = systemParts.join('\n').trim();
    if (!systemInstruction) {
      return contents;
    }

    if (contents.length > 0 && contents[0].role === 'user') {
      contents[0].parts[0].text = systemInstruction + '\n\n' + contents[0].parts[0].text;
    } else {
      contents.unshift({ role: 'user', parts: [{ text: systemInstruction }] });
    }
    
    return contents;
  }
}
