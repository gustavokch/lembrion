/**
 * AI Provider Registry with multi-provider support and internationalization
 */

import { AIModel, AIProvider, AIProviderConfig, EffortLevel } from '../../../types/ai.types';
import { Language } from '../../../types';
import { formatMessage } from '../../i18n/formatMessage';
import { getTranslations } from '../../i18n/translations';

/**
 * Output limit of a hosted request at each effort level. Reasoning tokens count against it,
 * so it grows with effort; the largest stays under Gemini's 65,536-token output limit.
 */
const HOSTED_MAX_OUTPUT_TOKENS: Record<Exclude<EffortLevel, 'default'>, number> = {
  none: 8000,
  minimal: 8000,
  low: 8000,
  medium: 16000,
  high: 32000,
  xhigh: 64000,
  max: 64000,
};

/**
 * Output limit for user-run servers at every level, for models that think at length before
 * answering. It stays fixed because the server's context window is unknown, and vLLM rejects
 * a limit that does not fit in it.
 */
const SERVER_MAX_OUTPUT_TOKENS = 16000;

/** Server levels: the server's own default, thinking off, or the three levels most servers map */
const SERVER_EFFORTS: readonly EffortLevel[] = ['default', 'none', 'low', 'medium', 'high'];

const OPENAI_MODELS: AIModel[] = [
  {
    id: 'gpt-6-luna',
    name: 'GPT-6 Luna',
    description: (t) => t.modelDescriptionGpt6Luna,
    costTier: 'low',
    recommended: true,
  },
  {
    id: 'gpt-6.1-terra',
    name: 'GPT-6.1 Terra',
    description: (t) => t.modelDescriptionGpt61Terra,
    costTier: 'medium',
  },
  {
    id: 'gpt-6.1-sol',
    name: 'GPT-6.1 Sol',
    description: (t) => t.modelDescriptionGpt61Sol,
    costTier: 'medium',
  },
  {
    id: 'gpt-6-astra',
    name: 'GPT-6 Astra',
    description: (t) => t.modelDescriptionGpt6Astra,
    costTier: 'high',
  },
];

const GEMINI_MODELS: AIModel[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    description: (t) => t.modelDescriptionGemini35FlashLite,
    costTier: 'low',
    recommended: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    description: (t) => t.modelDescriptionGemini38Flash,
    costTier: 'medium',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    description: (t) => t.modelDescriptionGemini4Argon,
    costTier: 'high',
  },
];

const ANTHROPIC_MODELS: AIModel[] = [
  {
    id: 'claude-haiku-5-5',
    name: 'Claude Haiku 5.5',
    description: (t) => t.modelDescriptionClaudeHaiku55,
    costTier: 'low',
    recommended: true,
  },
  {
    id: 'claude-sonnet-5-5',
    name: 'Claude Sonnet 5.5',
    description: (t) => t.modelDescriptionClaudeSonnet55,
    costTier: 'medium',
  },
  {
    id: 'claude-opus-5-5',
    name: 'Claude Opus 5.5',
    description: (t) => t.modelDescriptionClaudeOpus55,
    costTier: 'high',
  },
  {
    id: 'claude-fable-5-1',
    name: 'Claude Fable 5.1',
    description: (t) => t.modelDescriptionClaudeFable51,
    costTier: 'high',
  },
];

const DEEPSEEK_MODELS: AIModel[] = [
  {
    id: 'deepseek-flash',
    name: 'DeepSeek Flash',
    description: (t) => t.modelDescriptionDeepseekFlash,
    costTier: 'low',
    recommended: true,
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    description: (t) => t.modelDescriptionDeepseekV4Pro,
    costTier: 'medium',
  },
];

/**
 * Provider configurations with localized content
 */
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    id: 'openai',
    name: () => 'OpenAI',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-...',
    models: OPENAI_MODELS,
    defaultModel: 'gpt-6-luna',
    efforts: ['none', 'low', 'medium', 'high', 'xhigh', 'max'],
    defaultEffort: 'low',
  },

  gemini: {
    id: 'gemini',
    name: () => 'Google Gemini',
    requiresApiKey: true,
    apiKeyPlaceholder: 'AQ.... / AIza...',
    models: GEMINI_MODELS,
    defaultModel: 'gemini-3.5-flash-lite',
    efforts: ['minimal', 'low', 'medium', 'high'],
    defaultEffort: 'low',
  },

  anthropic: {
    id: 'anthropic',
    name: () => 'Anthropic Claude',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-ant-...',
    models: ANTHROPIC_MODELS,
    defaultModel: 'claude-haiku-5-5',
    efforts: ['low', 'medium', 'high', 'xhigh', 'max'],
    defaultEffort: 'low',
  },

  deepseek: {
    id: 'deepseek',
    name: () => 'DeepSeek',
    requiresApiKey: true,
    apiKeyPlaceholder: 'sk-...',
    models: DEEPSEEK_MODELS,
    defaultModel: 'deepseek-flash',
    efforts: ['none', 'low', 'high', 'max'],
    defaultEffort: 'none',
  },

  'custom-messages': {
    id: 'custom-messages',
    name: (t) => t.providerNameCustomMessages,
    requiresApiKey: false,
    apiKeyPlaceholder: '',
    models: [],
    defaultModel: '',
    endpointPath: '/messages',
    efforts: SERVER_EFFORTS,
    defaultEffort: 'default',
  },

  'custom-responses': {
    id: 'custom-responses',
    name: (t) => t.providerNameCustomResponses,
    requiresApiKey: false,
    apiKeyPlaceholder: '',
    models: [],
    defaultModel: '',
    endpointPath: '/responses',
    efforts: SERVER_EFFORTS,
    defaultEffort: 'default',
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
 * The stored level if the provider offers it, otherwise the provider's default: stored
 * settings may hold no level, or one written for an older list.
 */
export function resolveEffort(providerId: AIProvider, effort: unknown): EffortLevel {
  const { efforts, defaultEffort } = getProviderConfig(providerId);
  return efforts.find(level => level === effort) ?? defaultEffort;
}

/** Output limit for one request at `effort`; reasoning tokens count against it */
export function getMaxOutputTokens(providerId: AIProvider, effort: EffortLevel): number {
  if (getProviderConfig(providerId).endpointPath || effort === 'default') {
    return SERVER_MAX_OUTPUT_TOKENS;
  }
  return HOSTED_MAX_OUTPUT_TOKENS[effort];
}

/**
 * Get model by provider and model ID
 */
export function getModel(providerId: AIProvider, modelId: string): AIModel | undefined {
  const provider = getProviderConfig(providerId);
  return provider.models.find(model => model.id === modelId);
}

/**
 * Get localized provider name
 */
export function getLocalizedProviderName(providerId: AIProvider, language: Language): string {
  return getProviderConfig(providerId).name(getTranslations(language));
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
    case 'custom-messages':
      return t.providerDescriptionCustomMessages;
    case 'custom-responses':
      return t.providerDescriptionCustomResponses;
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
    case 'custom-messages':
      return t.setupInstructionsCustomMessages;
    case 'custom-responses':
      return t.setupInstructionsCustomResponses;
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
    case 'custom-messages':
    case 'custom-responses':
      return t.apiKeyLabelOptional;
  }
}

/**
 * Get localized cost tier
 */
export function getLocalizedCostTier(costTier: AIModel['costTier'], language: Language): string {
  const t = getTranslations(language);
  switch (costTier) {
    case 'low':
      return t.costTierLow;
    case 'medium':
      return t.costTierMedium;
    case 'high':
      return t.costTierHigh;
  }
}

/**
 * Get localized effort level name
 */
export function getLocalizedEffortName(effort: EffortLevel, language: Language): string {
  const t = getTranslations(language);
  switch (effort) {
    case 'default':
      return t.effortServerDefault;
    case 'none':
      return t.effortNone;
    case 'minimal':
      return t.effortMinimal;
    case 'low':
      return t.effortLow;
    case 'medium':
      return t.effortMedium;
    case 'high':
      return t.effortHigh;
    case 'xhigh':
      return t.effortExtraHigh;
    case 'max':
      return t.effortMax;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
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

  // A user-run server has no default address
  const baseUrl = settings.baseUrl?.trim();
  if (provider.endpointPath && !baseUrl) {
    errors.push(t.baseUrlRequired);
  } else if (baseUrl && !isHttpUrl(baseUrl)) {
    errors.push(t.invalidBaseUrlFormat);
  }
  
  // Check API key requirement
  if (provider.requiresApiKey && !settings.apiKey) {
    errors.push(formatMessage(t.apiKeyRequiredFor, { provider: getLocalizedProviderName(providerId, language) }));
  }
  
  // Any non-empty model id is accepted; the registry models are only suggestions
  if (!settings.model?.trim()) {
    errors.push(t.modelRequired);
  }
  
  return { valid: errors.length === 0, errors };
}
