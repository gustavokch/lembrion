/**
 * Centralized AI Service with multi-provider support
 */

import { Language } from '../../types';
import {
  AIError,
  AIProvider,
  AIProviderSettings,
  AIRequest,
  AIResponse,
  AnswerEvaluation,
  AnswerEvaluationRequest,
  ExplanationFeedbackRequest,
  GeneratedQuestion,
  QuestionGenerationRequest
} from '../../types/ai.types';
import { debugLog } from './debug';
import { createAIError, isAIError, toAIError } from './errors';
import {
  getPromptFragment,
  getPromptTemplate,
  replacePromptVariables
} from './prompts/promptRegistry';
import { AnthropicProvider } from './providers/anthropic';
import { DeepSeekProvider } from './providers/deepseek';
import { GeminiProvider } from './providers/gemini';
import { OllamaProvider } from './providers/ollama';
import { OpenAIProvider } from './providers/openai';
import { getProviderConfig, validateProviderConfig } from './providers/registry';
import { ParsedQuestion, parseEvaluationResponse, parseQuestionResponse } from './questionParser';

/** Minimum dissertative score (0-100) graded as correct */
export const PASS_SCORE = 70;

interface CompletionProvider {
  generateCompletion(request: AIRequest): Promise<AIResponse>;
}

/** Failures worth exactly one more attempt: a malformed reply or a provider server error */
function isRetriedOnce(error: AIError): boolean {
  if (error.code === 'INVALID_RESPONSE') return true;
  return error.code === 'API_ERROR' && error.statusCode !== undefined && error.statusCode >= 500;
}

/**
 * Main AI Service class
 */
export class AIService {
  private readonly providers: Record<AIProvider, CompletionProvider> = {
    openai: new OpenAIProvider(),
    gemini: new GeminiProvider(),
    anthropic: new AnthropicProvider(),
    deepseek: new DeepSeekProvider(),
    ollama: new OllamaProvider(),
  };

  /**
   * Generate a question using the specified provider
   */
  async generateQuestion(
    request: QuestionGenerationRequest,
    settings: AIProviderSettings
  ): Promise<GeneratedQuestion> {
    const startTime = Date.now();
    
    try {
      // Validate that at least one context is provided
      if (!request.contexts || request.contexts.length === 0) {
        throw createAIError(settings.provider, 'At least one study context is required', 'MISSING_CONTEXT');
      }

      // Validate provider settings
      const validation = validateProviderConfig(settings.provider, {
        apiKey: settings.apiKey,
        model: settings.model,
        baseUrl: settings.baseUrl,
      });
      
      if (!validation.valid) {
        throw this.invalidConfigError(settings.provider, validation.errors);
      }

      // Get provider configuration
      const providerConfig = getProviderConfig(settings.provider);

      // The prompt template id matches the question type
      const promptTemplate = getPromptTemplate(request.type, request.language as Language);
      
      // Format contexts and instructions as numbered lists
      const contextsList = request.contexts.map((ctx, i) => `${i+1}. ${ctx}`).join('\n');
      const instructionsList = request.instructions?.length 
        ? request.instructions.map((instr, i) => `${i+1}. ${instr}`).join('\n')
        : 'No special instructions provided.';
      
      const previousQuestionsText = request.previousQuestions?.length
        ? request.previousQuestions.slice(-5).join(', ')
        : 'None';

      // Replace variables in the prompt template
      const prompt = replacePromptVariables(promptTemplate, {
        contextsList,
        instructionsList,
        difficulty: request.difficulty || 'medium',
        previousQuestions: previousQuestionsText,
      });

      // Prepare AI request with enhanced user prompt for code questions
      const userPrompt = request.customPrompt || this.getEnhancedUserPrompt(request);

      debugLog('AI generation prompts:', { system: prompt, user: userPrompt });

      const aiRequest: AIRequest = {
        provider: settings.provider,
        model: settings.model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: providerConfig.temperature[request.type],
        maxTokens: providerConfig.maxTokens[request.type],
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        customHeaders: settings.customHeaders,
      };

      // A malformed reply or a provider 5xx is worth one more generation; the parse and code checks run per attempt
      const { response, parsedQuestion } = await this.withSingleRetry(async () => {
        const response = await this.generateCompletion(aiRequest);

        debugLog('AI raw response:', response.content);

        const parsedQuestion = parseQuestionResponse(response.content, request.type, settings.provider);

        // Validate that code questions actually contain code
        this.validateCodeContent(parsedQuestion, request.contexts, settings.provider);
        return { response, parsedQuestion };
      });
      
      // Add metadata
      const generatedQuestion: GeneratedQuestion = {
        ...parsedQuestion,
        metadata: {
          provider: settings.provider,
          model: settings.model,
          tokensUsed: response.usage?.totalTokens,
          generationTime: Date.now() - startTime,
        },
      };

      debugLog('AI generated question:', generatedQuestion);

      return generatedQuestion;
    } catch (error) {
      throw toAIError(error, settings.provider);
    }
  }

  /**
   * Evaluate a student's answer
   */
  async evaluateAnswer(
    request: AnswerEvaluationRequest,
    settings: AIProviderSettings
  ): Promise<AnswerEvaluation> {
    const startTime = Date.now();
    
    try {
      // Validate provider settings
      const validation = validateProviderConfig(settings.provider, {
        apiKey: settings.apiKey,
        model: settings.model,
        baseUrl: settings.baseUrl,
      });
      
      if (!validation.valid) {
        throw this.invalidConfigError(settings.provider, validation.errors);
      }

      // Get provider configuration
      const providerConfig = getProviderConfig(settings.provider);
      
      // Get and prepare evaluation prompt
      const language = request.language as Language;
      const promptTemplate = getPromptTemplate('evaluation', language);
      const correctAnswerText = request.correctAnswer 
        ? `Correct Answer: ${request.correctAnswer}`
        : '';
      const criteria = request.evaluationCriteria?.length
        ? request.evaluationCriteria.map((criterion, i) => `${i+1}. ${criterion}`).join('\n')
        : getPromptFragment('noCriteria', language);

      const prompt = replacePromptVariables(promptTemplate, {
        question: request.question,
        userAnswer: request.userAnswer,
        correctAnswer: correctAnswerText,
        criteria,
        type: request.type,
      });

      // The template holds both the instructions and the answer to grade, so it is the user turn
      const aiRequest: AIRequest = {
        provider: settings.provider,
        model: settings.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: providerConfig.temperature.evaluation,
        maxTokens: providerConfig.maxTokens.evaluation,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        customHeaders: settings.customHeaders,
      };

      // A reply without a usable verdict block or a provider 5xx is worth one more evaluation
      const { response, verdict } = await this.withSingleRetry(async () => {
        const response = await this.generateCompletion(aiRequest);
        return { response, verdict: parseEvaluationResponse(response.content, settings.provider) };
      });

      const evaluation: AnswerEvaluation = {
        isCorrect: verdict.score >= PASS_SCORE,
        score: verdict.score,
        feedback: verdict.feedback,
        metadata: {
          provider: settings.provider,
          model: settings.model,
          tokensUsed: response.usage?.totalTokens,
          evaluationTime: Date.now() - startTime,
        },
      };

      return evaluation;
    } catch (error) {
      throw toAIError(error, settings.provider);
    }
  }

  /**
   * Markdown feedback on a learner's self-explanation: what is right and what is missing.
   * It carries no score and does not change the answer's grade.
   */
  async evaluateExplanation(
    request: ExplanationFeedbackRequest,
    settings: AIProviderSettings
  ): Promise<string> {
    try {
      const validation = validateProviderConfig(settings.provider, {
        apiKey: settings.apiKey,
        model: settings.model,
        baseUrl: settings.baseUrl,
      });

      if (!validation.valid) {
        throw this.invalidConfigError(settings.provider, validation.errors);
      }

      const providerConfig = getProviderConfig(settings.provider);
      const prompt = replacePromptVariables(getPromptTemplate('explanationFeedback', request.language as Language), {
        question: request.question,
        correctAnswer: request.correctAnswer,
        explanation: request.explanation,
      });

      // Like evaluation: the template holds both the instructions and the text to review
      const aiRequest: AIRequest = {
        provider: settings.provider,
        model: settings.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: providerConfig.temperature.evaluation,
        maxTokens: providerConfig.maxTokens.evaluation,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        customHeaders: settings.customHeaders,
      };

      // An empty reply or a provider 5xx is worth one more request
      return await this.withSingleRetry(async () => {
        const feedback = ((await this.generateCompletion(aiRequest)).content || '').trim();
        if (!feedback) {
          throw createAIError(settings.provider, 'Empty explanation feedback', 'INVALID_RESPONSE', undefined, true);
        }
        return feedback;
      });
    } catch (error) {
      throw toAIError(error, settings.provider);
    }
  }

  /**
   * Generate elaborative question
   */
  async generateElaborativeQuestion(
    contexts: string[],
    originalQuestion: string,
    language: Language,
    settings: AIProviderSettings
  ): Promise<string> {
    try {
      if (!contexts || contexts.length === 0) {
        throw createAIError(settings.provider, 'At least one study context is required', 'MISSING_CONTEXT');
      }

      const promptTemplate = getPromptTemplate('elaborative', language);
      const contextsList = contexts.map((ctx, i) => `${i+1}. ${ctx}`).join('\n');
      
      const prompt = replacePromptVariables(promptTemplate, {
        contextsList,
        question: originalQuestion,
      });

      const aiRequest: AIRequest = {
        provider: settings.provider,
        model: settings.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 300,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        customHeaders: settings.customHeaders,
      };

      const response = await this.withSingleRetry(() => this.generateCompletion(aiRequest));
      return response.content;
    } catch (error) {
      throw toAIError(error, settings.provider);
    }
  }

  /**
   * Run `attempt` and, if it fails with an INVALID_RESPONSE AIError or a provider HTTP 5xx,
   * run it once more. Every other failure (4xx including 429, network, timeout) is thrown at once.
   */
  private async withSingleRetry<T>(attempt: () => Promise<T>): Promise<T> {
    try {
      return await attempt();
    } catch (error) {
      if (!isAIError(error) || !isRetriedOnce(error)) {
        throw error;
      }
      debugLog('AI request failed, retrying once:', { code: error.code, statusCode: error.statusCode });
      return await attempt();
    }
  }

  private invalidConfigError(provider: AIProvider, errors: string[]) {
    return createAIError(provider, `Invalid provider configuration: ${errors.join(', ')}`, 'INVALID_CONFIG');
  }

  /**
   * Generate completion using the appropriate provider
   */
  private async generateCompletion(request: AIRequest): Promise<AIResponse> {
    const provider = this.providers[request.provider];
    if (!provider) {
      throw new Error(`Provider not found: ${request.provider}`);
    }

    return await provider.generateCompletion(request);
  }

  /**
   * Check if contexts suggest code-related content
   */
  private isCodeContext(contexts: string[]): boolean {
    const contextsString = contexts.join(' ').toLowerCase();
    const codeKeywords = [
      'python', 'javascript', 'java', 'c++', 'c#', 'html', 'css', 'sql', 
      'php', 'ruby', 'go', 'rust', 'swift', 'programação', 'programming',
      'código', 'code', 'algoritmo', 'algorithm', 'função', 'function'
    ];
    
    return codeKeywords.some(keyword => contextsString.includes(keyword));
  }

  /**
   * Validate that code questions actually contain code
   */
  private validateCodeContent(question: ParsedQuestion, contexts: string[], provider: AIProvider): void {
    const questionText = question.question.toLowerCase();
    const contextText = contexts.join(' ').toLowerCase();
    
    // Check if this appears to be a code-related question
    const codeKeywords = [
      'código', 'code', 'programa', 'program', 'função', 'function', 
      'algoritmo', 'algorithm', 'script', 'saída', 'output', 'resultado',
      'execução', 'execution', 'python', 'javascript', 'java', 'c++', 'c#',
      'html', 'css', 'sql', 'php', 'ruby', 'go', 'rust', 'swift'
    ];
    
    const isCodeRelated = codeKeywords.some(keyword => 
      questionText.includes(keyword) || contextText.includes(keyword)
    );
    
    if (isCodeRelated) {
      // Check if the question contains code blocks
      const hasCodeBlock = question.question.includes('```') || question.question.includes('`');
      
      // Check for phrases that indicate missing code
      const missingCodePhrases = [
        'seguinte código', 'following code', 'código acima', 'code above',
        'código abaixo', 'code below', 'este código', 'this code'
      ];
      
      const hasMissingCodePhrase = missingCodePhrases.some(phrase => 
        questionText.includes(phrase)
      );
      
      if (hasMissingCodePhrase && !hasCodeBlock) {
        debugLog('Code question without code:', question.question);
        throw createAIError(
          provider,
          'Code question generated without actual code content. Please regenerate.',
          'INVALID_RESPONSE',
          undefined,
          true
        );
      }
    }
  }

  /**
   * Get enhanced user prompt with code requirements
   */
  private getEnhancedUserPrompt(request: QuestionGenerationRequest): string {
    const language = request.language as Language;
    const variables = {
      contexts: request.contexts.join(', '),
      difficulty: request.difficulty || getPromptFragment('defaultDifficulty', language),
      focusContext: request.focusContext || '',
    };
    
    let basePrompt = '';
    
    switch (request.type) {
      case 'multipleChoice':
        basePrompt = replacePromptVariables(getPromptFragment('multipleChoiceRequest', language), variables);
        break;
      
      case 'dissertative':
        basePrompt = replacePromptVariables(getPromptFragment('dissertativeRequest', language), variables);
        break;
    }

    if (request.focusContext) {
      basePrompt += replacePromptVariables(getPromptFragment('focusContext', language), variables);
    }
    
    // Add code-specific requirements if this appears to be a programming context
    if (this.isCodeContext(request.contexts)) {
      basePrompt += getPromptFragment('codeRequirement', language);
    }
    
    return basePrompt;
  }
}

// Export singleton instance
export const aiService = new AIService();
