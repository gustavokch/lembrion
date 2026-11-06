/**
 * AI Provider Registry with multi-provider support and internationalization
 */

import { AIModel, AIProvider, AIProviderConfig } from '../../../types/ai.types';
import { Language } from '../../../types';
import { formatMessage } from '../../i18n/formatMessage';
import { getTranslations } from '../../i18n/translations';

/**
 * OpenAI Provider Configuration
 */
const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: (t) => t.modelDescriptionGpt4o,
    contextWindow: 128000,
    costTier: 'high',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
    recommended: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: (t) => t.modelDescriptionGpt4oMini,
    contextWindow: 128000,
    costTier: 'medium',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: (t) => t.modelDescriptionGpt4Turbo,
    contextWindow: 128000,
    costTier: 'high',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: (t) => t.modelDescriptionGpt4,
    contextWindow: 8192,
    costTier: 'high',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: (t) => t.modelDescriptionGpt35Turbo,
    contextWindow: 16385,
    costTier: 'low',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: false,
      codeGeneration: true,
    },
  },
];

/**
 * Google Gemini Provider Configuration
 */
const GEMINI_MODELS: AIModel[] = [
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: (t) => t.modelDescriptionGemini15Pro,
    contextWindow: 2000000,
    costTier: 'medium',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
    recommended: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: (t) => t.modelDescriptionGemini15Flash,
    contextWindow: 1000000,
    costTier: 'low',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: (t) => t.modelDescriptionGeminiPro,
    contextWindow: 32768,
    costTier: 'medium',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
];

/**
 * Anthropic Claude Provider Configuration
 */
const ANTHROPIC_MODELS: AIModel[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: (t) => t.modelDescriptionClaude35Sonnet,
    contextWindow: 200000,
    costTier: 'high',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
    recommended: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    description: (t) => t.modelDescriptionClaude3Haiku,
    contextWindow: 200000,
    costTier: 'low',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: (t) => t.modelDescriptionClaude3Opus,
    contextWindow: 200000,
    costTier: 'high',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
];

/**
 * DeepSeek Provider Configuration
 */
const DEEPSEEK_MODELS: AIModel[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: (t) => t.modelDescriptionDeepseekChat,
    contextWindow: 32768,
    costTier: 'low',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
    recommended: true,
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    description: (t) => t.modelDescriptionDeepseekCoder,
    contextWindow: 16384,
    costTier: 'low',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
];

/**
 * Ollama Provider Configuration
 */
const OLLAMA_MODELS: AIModel[] = [
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 8B',
    description: (t) => t.modelDescriptionLlama318b,
    contextWindow: 128000,
    costTier: 'free',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
    recommended: true,
  },
  {
    id: 'llama3.1:70b',
    name: 'Llama 3.1 70B',
    description: (t) => t.modelDescriptionLlama3170b,
    contextWindow: 128000,
    costTier: 'free',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
  {
    id: 'mistral:7b',
    name: 'Mistral 7B',
    description: (t) => t.modelDescriptionMistral7b,
    contextWindow: 32768,
    costTier: 'free',
    capabilities: {
      multipleChoice: true,
      dissertative: true,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
  {
    id: 'codellama:13b',
    name: 'Code Llama 13B',
    description: (t) => t.modelDescriptionCodellama13b,
    contextWindow: 16384,
    costTier: 'free',
    capabilities: {
      multipleChoice: true,
      dissertative: false,
      evaluation: true,
      reasoning: true,
      codeGeneration: true,
    },
  },
];

/**
 * Provider configurations with localized content
 */
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-...',
    models: OPENAI_MODELS,
    defaultModel: 'gpt-4o-mini',
    maxTokens: {
      multipleChoice: 800,
      dissertative: 1200,
      evaluation: 600,
    },
    temperature: {
      multipleChoice: 0.7,
      dissertative: 0.8,
      evaluation: 0.6,
    },
  },

  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    requiresApiKey: true,
    apiKeyPlaceholder: 'AIza...',
    models: GEMINI_MODELS,
    defaultModel: 'gemini-1.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    maxTokens: {
      multipleChoice: 800,
      dissertative: 1200,
      evaluation: 600,
    },
    temperature: {
      multipleChoice: 0.7,
      dissertative: 0.8,
      evaluation: 0.6,
    },
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-ant-...',
    models: ANTHROPIC_MODELS,
    defaultModel: 'claude-3-haiku-20240307',
    baseUrl: 'https://api.anthropic.com/v1',
    maxTokens: {
      multipleChoice: 800,
      dissertative: 1200,
      evaluation: 600,
    },
    temperature: {
      multipleChoice: 0.7,
      dissertative: 0.8,
      evaluation: 0.6,
    },
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-...',
    models: DEEPSEEK_MODELS,
    defaultModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    maxTokens: {
      multipleChoice: 800,
      dissertative: 1200,
      evaluation: 600,
    },
    temperature: {
      multipleChoice: 0.7,
      dissertative: 0.8,
      evaluation: 0.6,
    },
  },

  ollama: {
    id: 'ollama',
    name: 'Ollama',
    requiresApiKey: false,
    apiKeyPlaceholder: '',
    models: OLLAMA_MODELS,
    defaultModel: 'llama3.1:8b',
    baseUrl: 'http://localhost:11434/v1',
    maxTokens: {
      multipleChoice: 800,
      dissertative: 1200,
      evaluation: 600,
    },
    temperature: {
      multipleChoice: 0.7,
      dissertative: 0.8,
      evaluation: 0.6,
    },
  },
};

/**
 * Get provider configuration by ID
 */
export function getProviderConfig(providerId: AIProvider): AIProviderConfig {
  const config = AI_PROVIDERS[providerId];
  if (!config) {
    throw new Error(`Provider not found: ${providerId}`);
  }
  return config;
}

/**
 * Get all available providers
 */
export function getAllProviders(): AIProviderConfig[] {
  return Object.values(AI_PROVIDERS);
}

/**
 * Get model by provider and model ID
 */
export function getModel(providerId: AIProvider, modelId: string): AIModel | undefined {
  const provider = getProviderConfig(providerId);
  return provider.models.find(model => model.id === modelId);
}

/**
 * Get localized provider name (brand names are the same in every language)
 */
export function getLocalizedProviderName(providerId: AIProvider, _language: Language): string {
  return getProviderConfig(providerId).name;
}

/**
 * Get localized provider description
 */
export function getLocalizedProviderDescription(providerId: AIProvider, language: Language): string {
  const t = getTranslations(language);
  switch (providerId) {
    case 'openai':
      return t.providerDescriptionOpenai;
    case 'gemini':
      return t.providerDescriptionGemini;
    case 'anthropic':
      return t.providerDescriptionAnthropic;
    case 'deepseek':
      return t.providerDescriptionDeepseek;
    case 'ollama':
      return t.providerDescriptionOllama;
  }
}

/**
 * Get localized model name
 */
export function getLocalizedModelName(providerId: AIProvider, modelId: string, _language: Language): string {
  const model = getModel(providerId, modelId);
  if (!model) return modelId;
  
  // Most model names are the same across languages, but we can add specific cases
  return model.name;
}

/**
 * Get localized model description
 */
export function getLocalizedModelDescription(
  providerId: AIProvider, 
  modelId: string,
  language: Language
): string {
  const model = getModel(providerId, modelId);
  return model ? model.description(getTranslations(language)) : '';
}

/**
 * Get localized setup instructions
 */
export function getLocalizedSetupInstructions(providerId: AIProvider, language: Language): string[] {
  const t = getTranslations(language);
  switch (providerId) {
    case 'openai':
      return t.setupInstructionsOpenai;
    case 'gemini':
      return t.setupInstructionsGemini;
    case 'anthropic':
      return t.setupInstructionsAnthropic;
    case 'deepseek':
      return t.setupInstructionsDeepseek;
    case 'ollama':
      return t.setupInstructionsOllama;
  }
}

/**
 * Get localized API key label
 */
export function getLocalizedApiKeyLabel(providerId: AIProvider, language: Language): string {
  const t = getTranslations(language);
  switch (providerId) {
    case 'openai':
      return t.apiKeyLabelOpenai;
    case 'gemini':
      return t.apiKeyLabelGemini;
    case 'anthropic':
      return t.apiKeyLabelAnthropic;
    case 'deepseek':
      return t.apiKeyLabelDeepseek;
    default:
      return t.apiKeyLabel;
  }
}

/**
 * Get localized cost tier
 */
export function getLocalizedCostTier(costTier: string, language: Language): string {
  const t = getTranslations(language);
  switch (costTier) {
    case 'free':
      return t.costTierFree;
    case 'low':
      return t.costTierLow;
    case 'medium':
      return t.costTierMedium;
    case 'high':
      return t.costTierHigh;
    default:
      return costTier;
  }
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(
  providerId: AIProvider, 
  settings: { apiKey?: string; model?: string; baseUrl?: string },
  language: Language = 'en-US'
): { valid: boolean; errors: string[] } {
  const provider = getProviderConfig(providerId);
  const t = getTranslations(language);
  const errors: string[] = [];
  
  // Check API key requirement
  if (provider.requiresApiKey && !settings.apiKey) {
    errors.push(formatMessage(t.apiKeyRequiredFor, { provider: getLocalizedProviderName(providerId, language) }));
  }
  
  // Any non-empty model id is accepted; the registry models are only suggestions
  if (!settings.model?.trim()) {
    errors.push(t.modelRequired);
  }
  
  // Check base URL for local providers
  if (providerId === 'ollama' && settings.baseUrl) {
    try {
      new URL(settings.baseUrl);
    } catch {
      errors.push(t.invalidBaseUrlFormat);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
