export type Language = 'en-US' | 'pt-BR';

export interface LanguageSettings {
  language: Language;
}

export interface Translations {
  // Navigation
  dashboard: string;
  study: string;
  history: string;
  settings: string;
  
  // Dashboard
  welcomeTitle: string;
  welcomeSubtitle: string;
  usingModel: string;
  totalSessions: string;
  completed: string;
  averageScore: string;
  startNewSession: string;
  beginNewSession: string;
  viewHistory: string;
  reviewPastSessions: string;
  recentSessions: string;
  questions: string;
  inProgress: string;
  score: string;
  
  // Study Session
  startNewStudySession: string;
  configureSession: string;
  questionType: string;
  multipleChoice: string;
  quickAssessment: string;
  dissertative: string;
  deepAnalysis: string;
  mixed: string;
  interleavedPractice: string;
  learningTechniques: string;
  spacedRepetitionDesc: string;
  interleavingDesc: string;
  elaborativeInterrogationDesc: string;
  selfExplanationDesc: string;
  desirableDifficultiesDesc: string;
  difficulty: string;
  difficultyEasy: string;
  difficultyMedium: string;
  difficultyHard: string;
  startEnhancedSession: string;
  generatingQuestion: string;
  question: string;
  confidenceQuestion: string;
  confidence: string;
  notConfident: string;
  veryConfident: string;
  excellent: string;
  keepLearning: string;
  aiEvaluation: string;
  modelAnswer: string;
  elaborativePrompt: string;
  explainReasoning: string;
  selfExplanationPrompt: string;
  selfExplanationPlaceholder: string;
  endSession: string;
  tryAgain: string;
  submitAnswer: string;
  evaluating: string;
  nextQuestion: string;
  
  // Session History
  studyHistory: string;
  reviewProgress: string;
  newSession: string;
  noSessionsYet: string;
  startFirstSession: string;
  questionsAnswered: string;
  date: string;
  continue: string;
  viewDetails: string;
  correctAnswers: string;
  
  // Session Details
  sessionNotFound: string;
  sessionNotFoundDesc: string;
  backToHistory: string;
  sessionDetails: string;
  questionsAndAnswers: string;
  correct: string;
  yourAnswer: string;
  feedback: string;
  attempts: string;
  attempt: string;
  reviewQuestion: string;
  answerScore: string;
  continueSession: string;
  
  // Settings
  settingsTitle: string;
  configurePreferences: string;
  apiKeyStored: string;
  spacedRepetition: string;
  interleaving: string;
  elaborativeInterrogation: string;
  selfExplanation: string;
  desirableDifficulties: string;
  language: string;
  selectLanguage: string;
  openSourceProject: string;
  openSourceDescription: string;
  viewOnGitHub: string;
  ready: string;
  requiresApiKey: string;
  
  // AI Provider Settings
  aiProvider: string;
  providerConfiguration: string;
  invalidConfiguration: string;
  invalidApiKeyFormat: string;
  costTier: string;
  recommended: string;
  
  // Setup Instructions
  setupInstructions: string;
  howToGetKey: string;
  
  // Configuration Fields
  baseUrl: string;
  baseUrlPlaceholder: string;
  model: string;
  modelInputHelp: string;
  suggestedModels: string;
  
  // Data Management
  manageYourData: string;
  deleteAllData: string;
  deleteAllDataConfirm: string;
  deleteAllDataDesc: string;
  
  // Language Switch Modal
  cancel: string;
  
  // Pricing
  supportLembrion: string;
  supportLembrionDesc: string;
  freeForever: string;
  freeForeverDesc: string;
  noAccountRequired: string;
  startLearningImmediately: string;
  noAccountRequiredDesc: string;
  whySponsorLembrion: string;
  keepItFree: string;
  keepItFreeDesc: string;
  fundDevelopment: string;
  fundDevelopmentDesc: string;
  serverCosts: string;
  serverCostsDesc: string;
  privacyFirst: string;
  privacyFirstDesc: string;
  privacyFocused: string;
  dataStaysInBrowser: string;
  noTrackingOrAnalytics: string;
  completeAnonymity: string;
  transparencyTrust: string;
  transparencyTrustDesc: string;
  
  // Theme Support
  theme: string;
  selectTheme: string;
  
  // API Key Notifications
  apiKeyConfigured: string;
  apiKeyConfiguredDesc: string;
  invalidApiKey: string;
  invalidApiKeyDesc: string;
  apiKeyUnknownProvider: string;

  // Storage
  storageWriteFailed: string;
  storageWriteFailedDesc: string;
  
  // Version Control
  appUpdated: string;
  versionUpdated: string;
  dataRefreshed: string;
  
  // AI errors
  aiErrorMissingApiKey: string;
  aiErrorMissingContext: string;
  aiErrorInvalidConfig: string;
  aiErrorInvalidApiKey: string;
  aiErrorRateLimited: string;
  aiErrorProvider: string;
  aiErrorInvalidResponse: string;
  aiErrorNetwork: string;
  aiErrorOllamaConnection: string;
  aiErrorTimeout: string;
  aiErrorUnknown: string;

  // Badges
  freeAppBadgeShort: string;
  dashboardBadge: string;

  // Common
  error: string;
  delete: string;
  edit: string;
  save: string;
  saved: string;
  add: string;
  all: string;
  clear: string;
  required: string;
  added: string;
  removed: string;
  data: string;
  supportUs: string;
  /** Placeholder: {count} */
  questionCountOne: string;
  /** Placeholder: {count} */
  questionCountOther: string;

  // Loading Screen
  loadingExperience: string;
  loadingOptimizing: string;

  // Dashboard extras
  dataTipTitle: string;
  dataTipDesc: string;
  dismissTip: string;
  startNow: string;
  viewHistoryLink: string;
  supportLembrionShortDesc: string;
  otherOptions: string;
  viewAll: string;
  continueSessionLink: string;
  noRecentSessions: string;
  startLearningJourney: string;
  startLearningJourneyDesc: string;

  // Session History extras
  noSessionsYetDesc: string;
  historyTip: string;
  searchSessions: string;
  /** Placeholder: {count} */
  selectedCountOne: string;
  /** Placeholder: {count} */
  selectedCountOther: string;
  selectAll: string;
  deleteSelected: string;
  noSessionsFound: string;
  adjustFilters: string;
  confirmDeletion: string;
  /** Placeholder: {count} */
  deleteSessionsConfirmOne: string;
  /** Placeholder: {count} */
  deleteSessionsConfirmOther: string;
  searchResults: string;
  noResultsFound: string;

  // Session Details extras
  noAnswerProvided: string;

  // Study Page extras
  configureProviderFirst: string;
  correctFeedback: string;
  incorrectFeedback: string;
  studyContexts: string;
  studyContextsHelp: string;
  studyContextPlaceholder: string;
  specialInstructions: string;
  specialInstructionsHelp: string;
  studyInstructionPlaceholder: string;
  configurationSummary: string;
  contextsLabel: string;
  instructionsLabel: string;
  dissertativeAnswerPlaceholder: string;

  // Review queue and explanation feedback
  reviewCardTitle: string;
  /** Placeholder: {count} */
  reviewDueCountOne: string;
  /** Placeholder: {count} */
  reviewDueCountOther: string;
  /** Placeholder: {date} */
  reviewNextDue: string;
  startReview: string;
  reviewCompleteTitle: string;
  reviewCompleteDesc: string;
  reviewSessionLabel: string;
  getFeedback: string;
  gettingFeedback: string;
  explanationFeedbackTitle: string;

  // Session Edit Modal
  editSession: string;
  customizeSession: string;
  unsavedChanges: string;
  unsavedChangesConfirm: string;
  editTabBasic: string;
  editTabBasicDesc: string;
  editTabLearning: string;
  editTabLearningDesc: string;
  editTabAdvanced: string;
  editTabAdvancedDesc: string;
  editTabHistoryDesc: string;
  editContextPlaceholder: string;
  addContext: string;
  /** Placeholder: {count} */
  contextCountOne: string;
  /** Placeholder: {count} */
  contextCountOther: string;
  atLeastOneContextRequired: string;
  specialInstructionsOptional: string;
  editInstructionPlaceholder: string;
  addInstruction: string;
  /** Placeholder: {count} */
  instructionCountOne: string;
  /** Placeholder: {count} */
  instructionCountOther: string;
  learningScienceBased: string;
  scientificResearchTitle: string;
  scientificResearchDesc: string;
  visualizationOptions: string;
  enableLatex: string;
  enableLatexDesc: string;
  enableCodeVisualization: string;
  enableCodeVisualizationDesc: string;
  sessionInformation: string;
  createdLabel: string;
  statusLabel: string;
  questionsLabel: string;
  scoreLabel: string;
  contextsHistory: string;
  contextsChange: string;
  previousLabel: string;
  newLabel: string;
  instructionsHistory: string;
  learningTechniquesHistory: string;
  learningTechniquesUpdated: string;
  noChangesYet: string;
  noChangesYetDesc: string;

  // Pricing extras
  openSourceOnGitHub: string;
  openSourceOnGitHubDesc: string;
  stars: string;
  forks: string;
  contributors: string;
  supportOnPatreon: string;
  supportOnPatreonDesc: string;
  supportOnPatreonButton: string;

  // Settings extras
  languageTip: string;
  languageTipDesc: string;

  // Theme Selector
  selectThemeAria: string;
  closeThemeSelector: string;
  themesOptimized: string;
  themeNameLight: string;
  themeNameDark: string;
  themeNameFocus: string;
  themeNameMidnight: string;
  themeNameForest: string;
  themeNameOcean: string;
  themeNameSunset: string;
  themeNameNeon: string;
  themeNameMinimal: string;
  themeNameWarm: string;
  themeDescriptionLight: string;
  themeDescriptionDark: string;
  themeDescriptionFocus: string;
  themeDescriptionMidnight: string;
  themeDescriptionForest: string;
  themeDescriptionOcean: string;
  themeDescriptionSunset: string;
  themeDescriptionNeon: string;
  themeDescriptionMinimal: string;
  themeDescriptionWarm: string;
  themeCategoryStandard: string;
  themeCategoryFocus: string;
  themeCategoryEnergy: string;
  themeCategoryCalm: string;

  // AI Provider Registry
  providerDescriptionOpenai: string;
  providerDescriptionGemini: string;
  providerDescriptionAnthropic: string;
  providerDescriptionDeepseek: string;
  providerDescriptionOllama: string;
  setupInstructionsOpenai: string[];
  setupInstructionsGemini: string[];
  setupInstructionsAnthropic: string[];
  setupInstructionsDeepseek: string[];
  setupInstructionsOllama: string[];
  apiKeyLabel: string;
  apiKeyLabelOpenai: string;
  apiKeyLabelGemini: string;
  apiKeyLabelAnthropic: string;
  apiKeyLabelDeepseek: string;
  costTierFree: string;
  costTierLow: string;
  costTierMedium: string;
  costTierHigh: string;
  /** Placeholder: {provider} */
  apiKeyRequiredFor: string;
  modelRequired: string;
  invalidBaseUrlFormat: string;
  modelDescriptionGpt4o: string;
  modelDescriptionGpt4oMini: string;
  modelDescriptionGpt4Turbo: string;
  modelDescriptionGpt4: string;
  modelDescriptionGpt35Turbo: string;
  modelDescriptionGemini15Pro: string;
  modelDescriptionGemini15Flash: string;
  modelDescriptionGeminiPro: string;
  modelDescriptionClaude35Sonnet: string;
  modelDescriptionClaude3Haiku: string;
  modelDescriptionClaude3Opus: string;
  modelDescriptionDeepseekChat: string;
  modelDescriptionDeepseekCoder: string;
  modelDescriptionLlama318b: string;
  modelDescriptionLlama3170b: string;
  modelDescriptionMistral7b: string;
  modelDescriptionCodellama13b: string;
}