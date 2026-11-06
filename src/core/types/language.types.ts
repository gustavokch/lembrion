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
  /** Placeholder: {path} */
  baseUrlHint: string;
  model: string;
  modelInputHelp: string;
  modelInputHelpServer: string;
  suggestedModels: string;
  effort: string;
  effortHint: string;
  effortHintServer: string;
  effortServerDefault: string;
  effortNone: string;
  effortMinimal: string;
  effortLow: string;
  effortMedium: string;
  effortHigh: string;
  effortExtraHigh: string;
  effortMax: string;
  
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
  aiErrorEndpointConnection: string;
  aiErrorRefused: string;
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
  providerNameCustomMessages: string;
  providerNameCustomResponses: string;
  providerDescriptionCustomMessages: string;
  providerDescriptionCustomResponses: string;
  setupInstructionsOpenai: string[];
  setupInstructionsGemini: string[];
  setupInstructionsAnthropic: string[];
  setupInstructionsDeepseek: string[];
  setupInstructionsCustomMessages: string[];
  setupInstructionsCustomResponses: string[];
  apiKeyLabel: string;
  apiKeyLabelOpenai: string;
  apiKeyLabelGemini: string;
  apiKeyLabelAnthropic: string;
  apiKeyLabelDeepseek: string;
  apiKeyLabelOptional: string;
  costTierLow: string;
  costTierMedium: string;
  costTierHigh: string;
  /** Placeholder: {provider} */
  apiKeyRequiredFor: string;
  modelRequired: string;
  baseUrlRequired: string;
  invalidBaseUrlFormat: string;
  modelDescriptionGpt6Luna: string;
  modelDescriptionGpt61Terra: string;
  modelDescriptionGpt61Sol: string;
  modelDescriptionGpt6Astra: string;
  modelDescriptionGemini35FlashLite: string;
  modelDescriptionGemini38Flash: string;
  modelDescriptionGemini4Argon: string;
  modelDescriptionClaudeHaiku55: string;
  modelDescriptionClaudeSonnet55: string;
  modelDescriptionClaudeOpus55: string;
  modelDescriptionClaudeFable51: string;
  modelDescriptionDeepseekFlash: string;
  modelDescriptionDeepseekV4Pro: string;

  // Dashboard
  dashboardProgress: string;
  dashboardLast7Days: string;
  dashboardAllTime: string;
  dashboardSessions: string;
  dashboardAnswered: string;
  dashboardAccuracy: string;
  dashboardUnfinishedOne: string;
  dashboardUnfinishedOther: string;
  /** Placeholder: {count} */
  dashboardAnsweredCountOne: string;
  /** Placeholder: {count} */
  dashboardAnsweredCountOther: string;
  /** Placeholder: {percent} */
  dashboardPercentCorrect: string;
  /** Placeholder: {date} */
  dashboardStarted: string;
  dashboardNoUnfinished: string;
  dashboardNoUnfinishedDesc: string;
  dashboardResume: string;
  /** Placeholder: {topics} */
  dashboardResumeAria: string;
  dashboardDueForReturn: string;
  /** Placeholder: {count} */
  dashboardOverdueOne: string;
  /** Placeholder: {count} */
  dashboardOverdueOther: string;
  /** Placeholder: {count} */
  dashboardDueToday: string;
  /** Placeholder: {count} */
  dashboardDueThisWeek: string;
  /** Placeholder: {count} */
  dashboardStartReview: string;
  /** Placeholder: {count} */
  dashboardResumeReview: string;
  dashboardCallNo: string;
  dashboardTopic: string;
  dashboardBox: string;
  dashboardDueDateColumn: string;
  /** Placeholders: {box}, {days} */
  dashboardBoxIntervalOne: string;
  /** Placeholders: {box}, {days} */
  dashboardBoxIntervalOther: string;
  /** Placeholder: {date} */
  dashboardOverdueStamp: string;
  /** Placeholder: {count} */
  dashboardMoreDue: string;
  dashboardNotYetDue: string;
  /** Placeholder: {date} */
  dashboardNextReturn: string;
  dashboardNothingOnLoan: string;
  dashboardLoanPeriods: string;
  /** Placeholder: {count} */
  dashboardOnLoanCountOne: string;
  /** Placeholder: {count} */
  dashboardOnLoanCountOther: string;
  /** Placeholder: {count} */
  dashboardRetiredCountOne: string;
  /** Placeholder: {count} */
  dashboardRetiredCountOther: string;
  /** Placeholder: {box} */
  dashboardBoxNumber: string;
  /** Placeholder: {days} */
  dashboardDays: string;
  /** Placeholder: {days} */
  dashboardAxisDays: string;
  dashboardOnLoanColumn: string;
  dashboardDueColumn: string;
  /** Placeholder: {count} */
  dashboardDueCountOne: string;
  /** Placeholder: {count} */
  dashboardDueCountOther: string;
  dashboardRetired: string;
  dashboardAllHistory: string;
  dashboardTopics: string;
  dashboardStatus: string;
  /** One session's status; `completed` is the plural filter label. */
  sessionStatusCompleted: string;
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
  historyColCallNo: string;
  /** Placeholder: {date} */
  detailsStampDue: string;
  /** Placeholder: {date} */
  detailsStampOverdue: string;
  detailsStampRetired: string;
  detailsStampReturned: string;

  // Settings, Support, and Markdown code blocks
  settingsProviderTitle: string;
  /** Placeholder: {provider} */
  settingsProviderSettingsTitle: string;
  settingsProviderConfigured: string;
  settingsProviderNeedsKey: string;
  settingsProviderIncomplete: string;
  settingsAutoSave: string;
  settingsShowApiKey: string;
  settingsEndpointSetupTitle: string;
  settingsEndpointGuide: string;
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
  studyProviderNotReady: string;
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
  studyComesBack: string;
  studyReturnBox: string;
  studyReturned: string;
  studyReturnedForGood: string;
  studyEnterKey: string;
  studyEnterFullscreen: string;
  studyExitFullscreen: string;
}