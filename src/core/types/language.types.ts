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
  usingModel: string;
  totalSessions: string;
  completed: string;
  startNewSession: string;
  recentSessions: string;
  questions: string;
  inProgress: string;
  score: string;
  
  // Study Session
  startNewStudySession: string;
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
  aiEvaluation: string;
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
  newSession: string;
  noSessionsYet: string;
  startFirstSession: string;
  questionsAnswered: string;
  date: string;
  continue: string;
  
  // Session Details
  sessionNotFound: string;
  sessionNotFoundDesc: string;
  backToHistory: string;
  questionsAndAnswers: string;
  correct: string;
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
  viewOnGitHub: string;
  requiresApiKey: string;
  
  // AI Provider Settings
  aiProvider: string;
  invalidConfiguration: string;
  invalidApiKeyFormat: string;
  costTier: string;
  recommended: string;
  
  // Setup Instructions
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
  freeForeverDesc: string;
  dataStaysInBrowser: string;
  noTrackingOrAnalytics: string;
  
  // Theme Support
  theme: string;
  
  // API Key Notifications
  apiKeyConfigured: string;
  apiKeyConfiguredDesc: string;
  apiKeyLinkFailed: string;
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

  // Dashboard extras
  dataTipDesc: string;

  // Session History extras
  noSessionsYetDesc: string;
  searchSessions: string;
  /** Placeholder: {count} */
  selectedCountOne: string;
  /** Placeholder: {count} */
  selectedCountOther: string;
  selectAll: string;
  deleteSelected: string;
  adjustFilters: string;
  confirmDeletion: string;
  /** Placeholder: {count} */
  deleteSessionsConfirmOne: string;
  /** Placeholder: {count} */
  deleteSessionsConfirmOther: string;

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
  instructionsLabel: string;
  dissertativeAnswerPlaceholder: string;

  // Review queue and explanation feedback
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
  unsavedChanges: string;
  unsavedChangesConfirm: string;
  editTabHistoryDesc: string;
  editContextPlaceholder: string;
  addContext: string;
  /** Placeholder: {count} */
  contextCountOne: string;
  /** Placeholder: {count} */
  contextCountOther: string;
  atLeastOneContextRequired: string;
  editInstructionPlaceholder: string;
  addInstruction: string;
  /** Placeholder: {count} */
  instructionCountOne: string;
  /** Placeholder: {count} */
  instructionCountOther: string;
  enableLatex: string;
  enableLatexDesc: string;
  enableCodeVisualization: string;
  enableCodeVisualizationDesc: string;
  scoreLabel: string;
  contextsHistory: string;
  previousLabel: string;
  newLabel: string;
  instructionsHistory: string;
  learningTechniquesHistory: string;
  learningTechniquesUpdated: string;
  noChangesYetDesc: string;

  // Pricing extras
  openSourceOnGitHubDesc: string;
  supportOnPatreon: string;
  supportOnPatreonDesc: string;
  supportOnPatreonButton: string;

  // Settings extras
  languageTipDesc: string;

  // Theme selector and app shell
  selectThemeAria: string;
  themeNameSystem: string;
  themeNameLight: string;
  themeNameDark: string;
  themeNameContrast: string;
  skipToContent: string;
  mainNavigation: string;
  openMenu: string;
  closeMenu: string;

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

  // Dashboard
  dashboardProgress: string;
  dashboardMeasure: string;
  dashboardLast7Days: string;
  dashboardAllTime: string;
  dashboardSessions: string;
  dashboardAccuracy: string;
  dashboardReviewBoxes: string;
  dashboardBox: string;
  dashboardScheduledQuestions: string;
  /** Placeholders: {box}, {days} */
  dashboardBoxLabel: string;
  /** Placeholder: {days} */
  dashboardDays: string;
  /** Placeholders: {due}, {retired} */
  dashboardBoxSummary: string;
  /** Placeholder: {count} */
  dashboardBoxDue: string;
  dashboardDueNow: string;
  dashboardNext: string;
  dashboardResumeReview: string;
  dashboardResume: string;
  /** Placeholder: {topics} */
  dashboardResumeAria: string;
  dashboardAllSessions: string;
  dashboardTopics: string;
  dashboardType: string;
  dashboardStatus: string;
  dashboardProviderNotReady: string;
  dashboardOpenSettings: string;
  dashboardSupportLine: string;

  // History, session details, and the session edit dialog
  /** Placeholder: {count} */
  historySessionCountOne: string;
  /** Placeholder: {count} */
  historySessionCountOther: string;
  historySearchLabel: string;
  historyStatusFilter: string;
  historyStatusActive: string;
  historySelect: string;
  historyDoneSelecting: string;
  historyColTopics: string;
  historyColType: string;
  historyColStarted: string;
  historyColStatus: string;
  historyColActions: string;
  historyResume: string;
  /** Placeholder: {topics} */
  historyEditAria: string;
  /** Placeholder: {topics} */
  historyDeleteAria: string;
  /** Placeholder: {topics} */
  historySelectAria: string;
  historyNoMatch: string;
  historyClearFilters: string;
  detailsAnswered: string;
  detailsIncorrect: string;
  detailsNotAnswered: string;
  /** Placeholder: {value} */
  detailsConfidence: string;
  detailsYourAnswer: string;
  detailsModelAnswer: string;
  detailsFeedback: string;
  /** Placeholder: {score} */
  detailsFeedbackScore: string;
  detailsExplanation: string;
  detailsEvaluation: string;
  editClose: string;
  editTopics: string;
  editNewTopic: string;
  editInstructions: string;
  editNewInstruction: string;
  editOptional: string;
  /** Placeholder: {item} */
  editRemoveItem: string;
  editDisplay: string;

  // Settings, Support, and Markdown code blocks
  settingsProviderTitle: string;
  /** Placeholder: {provider} */
  settingsProviderSettingsTitle: string;
  settingsProviderConfigured: string;
  settingsProviderNeedsKey: string;
  settingsProviderIncomplete: string;
  settingsAutoSave: string;
  settingsShowApiKey: string;
  settingsOllamaSetupTitle: string;
  /** Placeholder: {site} */
  settingsOpenSite: string;
  settingsStoredDataTitle: string;
  settingsDeleteConfirmButton: string;
  supportCostsTitle: string;
  supportSourceTitle: string;
  markdownCopyCode: string;
  markdownCodeCopied: string;

  // Study setup and question loop
  studyOptional: string;
  /** Placeholder: {item} */
  studyRemoveItem: string;
  studySessionSummaryTitle: string;
  studyChange: string;
  studyTechniquesOn: string;
  /** Placeholder: {provider} */
  studyProviderNeedsKey: string;
  studyOpenSettings: string;
  /** Placeholders: {answered}, {correct} */
  studyProgressSummary: string;
  /** Placeholder: {number} */
  studyQuestionNumber: string;
  /** Placeholders: {number}, {total} */
  studyQuestionNumberOf: string;
  studyAnswerOptions: string;
  studyCorrectAnswerNote: string;
  studyYourAnswerNote: string;
  studyYourAnswerCorrectNote: string;
  /** Placeholder: {value} */
  studyConfidenceValue: string;
  studyExplanationTitle: string;
  studyFeedbackTitle: string;
  /** Placeholder: {score} */
  studyFeedbackScoreTitle: string;
  studyElaborativeAnswerLabel: string;
  /** Placeholder: {letter} */
  studySelfExplanationPromptOption: string;
  studyWritingFollowUp: string;
  studyThisSession: string;
  studyAnsweredLabel: string;
  studySettingOn: string;
  studySettingOff: string;
  studyLeftInQueue: string;
  studyEnterKey: string;
  studyEnterFullscreen: string;
  studyExitFullscreen: string;
}