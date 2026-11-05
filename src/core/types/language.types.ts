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
  accuracy: string;
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
  supportStudorama: string;
  supportStudoramaDesc: string;
  freeForever: string;
  freeForeverDesc: string;
  noAccountRequired: string;
  startLearningImmediately: string;
  noAccountRequiredDesc: string;
  whySponsorStudorama: string;
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
}