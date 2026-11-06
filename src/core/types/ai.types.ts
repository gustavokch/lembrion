/**
 * Core AI types for multi-provider support
 */

import { Translations } from './language.types';

export const AI_PROVIDER_IDS = ['openai', 'gemini', 'anthropic', 'deepseek', 'custom-messages', 'custom-responses'] as const;

export type AIProvider = typeof AI_PROVIDER_IDS[number];

/**
 * How much a model reasons before it answers, lowest first. 'default' sends no setting,
 * so a user-run server applies its model's own default.
 */
export const EFFORT_LEVELS = ['default', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const;

export type EffortLevel = typeof EFFORT_LEVELS[number];

/** Settings for one provider, persisted inside MultiProviderSettings. */
export interface ProviderSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
  /** Unset, or a level the provider does not offer: its default level (resolveEffort) */
  effort?: EffortLevel;
}

/** Shape persisted under STORAGE_KEYS.MULTI_PROVIDER_SETTINGS. */
export interface MultiProviderSettings {
  currentProvider: AIProvider;
  providers: Record<AIProvider, ProviderSettings>;
}

export interface AIModel {
  id: string;
  name: string;
  /** Description in the active language, read from its Translations */
  description: (t: Translations) => string;
  costTier: 'low' | 'medium' | 'high';
  recommended?: boolean;
}

export interface AIProviderConfig {
  id: AIProvider;
  /** Name in the active language; brand names ignore `t` */
  name: (t: Translations) => string;
  requiresApiKey: boolean;
  apiKeyPlaceholder: string;
  /** Suggestions only: any model id is accepted */
  models: AIModel[];
  defaultModel: string;
  /** For a user-run server: the path lembrion appends to the base URL the user enters */
  endpointPath?: '/messages' | '/responses';
  /** Levels offered in Settings, lowest first. Support varies by model: a model rejects a level it lacks. */
  efforts: readonly EffortLevel[];
  /** The level used until the user picks one */
  defaultEffort: EffortLevel;
}

export interface AIProviderSettings extends ProviderSettings {
  provider: AIProvider;
}

export interface AIRequest {
  provider: AIProvider;
  model: string;
  messages: AIMessage[];
  maxTokens: number;
  effort: EffortLevel;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

export interface QuestionGenerationRequest {
  contexts: string[]; // Minimum 1 context required (replaces subject)
  type: 'multipleChoice' | 'dissertative';
  language: string;
  instructions?: string[];
  previousQuestions?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  /** One of `contexts` to center this question on; the others only define scope */
  focusContext?: string;
  customPrompt?: string;
}

export interface GeneratedQuestion {
  question: string;
  type: 'multipleChoice' | 'dissertative';
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  sampleAnswer?: string;
  evaluationCriteria?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: {
    provider: AIProvider;
    model: string;
    tokensUsed?: number;
    generationTime?: number;
  };
}

export interface AnswerEvaluationRequest {
  question: string;
  userAnswer: string;
  correctAnswer?: string;
  evaluationCriteria?: string[];
  type: 'multipleChoice' | 'dissertative';
  language: string;
  customPrompt?: string;
}

export interface AnswerEvaluation {
  isCorrect: boolean;
  score: number; // 0-100
  feedback: string;
  suggestions?: string[];
  metadata?: {
    provider: AIProvider;
    model: string;
    tokensUsed?: number;
    evaluationTime?: number;
  };
}

/** A learner's self-explanation of why `correctAnswer` answers `question` */
export interface ExplanationFeedbackRequest {
  question: string;
  correctAnswer: string;
  explanation: string;
  language: string;
}

export interface AIError extends Error {
  provider: AIProvider;
  code?: string;
  statusCode?: number;
  retryable?: boolean;
  /** Provider-supplied error text from an HTTP error body; shown untranslated */
  detail?: string;
}
