import { Translations } from '../../../types';

export const enUS: Translations = {
  // Navigation
  dashboard: 'Dashboard',
  study: 'Study',
  history: 'History',
  settings: 'Settings',
  
  // Dashboard
  welcomeTitle: 'Welcome to Studorama',
  welcomeSubtitle: 'AI-powered study sessions to enhance your learning',
  usingModel: 'Using model:',
  totalSessions: 'Total Sessions',
  completed: 'Completed',
  averageScore: 'Average Score',
  startNewSession: 'Start New Session',
  beginNewSession: 'Begin a new AI-powered study session',
  viewHistory: 'View History',
  reviewPastSessions: 'Review your past study sessions',
  recentSessions: 'Recent Sessions',
  questions: 'questions',
  inProgress: 'In Progress',
  score: 'score',
  
  // Study Session
  startNewStudySession: 'Start New Study Session',
  configureSession: 'Configure your AI-powered study session with proven learning techniques',
  questionType: 'Question Type',
  multipleChoice: 'Multiple Choice',
  quickAssessment: 'Quick assessment questions',
  dissertative: 'Dissertative',
  deepAnalysis: 'Deep analysis questions',
  mixed: 'Mixed',
  interleavedPractice: 'Interleaved practice',
  learningTechniques: 'Learning Techniques',
  spacedRepetitionDesc: 'Missed questions come back after 3 new ones, up to 2 times',
  interleavingDesc: 'With 2 or more contexts, each new question focuses on the next context in turn',
  elaborativeInterrogationDesc: 'After a wrong answer, answer a "why" question about the topic',
  selfExplanationDesc: 'After an answer, explain in your own words why the correct answer is right',
  desirableDifficultiesDesc: 'Difficulty goes up after 3 correct answers in a row and down after 2 misses in a row',
  difficulty: 'Difficulty',
  difficultyEasy: 'Easy',
  difficultyMedium: 'Medium',
  difficultyHard: 'Hard',
  startEnhancedSession: 'Start Enhanced Study Session',
  generatingQuestion: 'Generating your next question...',
  question: 'Question',
  confidenceQuestion: 'How confident are you in your answer?',
  notConfident: 'Not confident',
  veryConfident: 'Very confident',
  excellent: 'Excellent!',
  keepLearning: 'Keep Learning!',
  aiEvaluation: 'AI Evaluation:',
  modelAnswer: 'Model Answer:',
  elaborativePrompt: 'Elaborative Interrogation: Why do you think this is the correct answer?',
  explainReasoning: 'Explain your reasoning and why this answer makes sense...',
  selfExplanationPrompt: 'Explain in your own words why the correct answer is right',
  selfExplanationPlaceholder: 'Write your explanation...',
  endSession: 'End Session',
  tryAgain: 'Try Again',
  submitAnswer: 'Submit Answer',
  evaluating: 'Evaluating...',
  nextQuestion: 'Next Question',
  
  // Session History
  studyHistory: 'Study History',
  reviewProgress: 'Review your past study sessions and progress',
  newSession: 'New Session',
  noSessionsYet: 'No Study Sessions Yet',
  startFirstSession: 'Start First Session',
  questionsAnswered: 'Questions Answered',
  date: 'Date',
  accuracy: 'Accuracy',
  continue: 'Continue',
  viewDetails: 'View Details',
  correctAnswers: 'Correct Answers',
  
  // Session Details
  sessionNotFound: 'Session Not Found',
  sessionNotFoundDesc: "The study session you're looking for doesn't exist.",
  backToHistory: 'Back to History',
  sessionDetails: 'Study Session Details',
  questionsAndAnswers: 'Questions & Answers',
  correct: 'Correct',
  yourAnswer: 'Your Answer',
  feedback: 'Feedback:',
  attempts: 'attempts',
  attempt: 'attempt',
  reviewQuestion: 'Review',
  answerScore: 'Score',
  continueSession: 'Continue Session',
  
  // Settings
  settingsTitle: 'Settings',
  configurePreferences: 'Configure your Studorama preferences and learning techniques',
  apiKeyStored: 'Your API key is stored in this browser\'s local storage and is sent only to the selected AI provider with each request.',
  spacedRepetition: 'Spaced Repetition',
  interleaving: 'Interleaving',
  elaborativeInterrogation: 'Elaborative Interrogation',
  selfExplanation: 'Self-Explanation',
  desirableDifficulties: 'Desirable Difficulties',
  language: 'Language',
  selectLanguage: 'Select your preferred language',
  openSourceProject: 'Open Source Project',
  openSourceDescription: 'Studorama is completely open source and available on GitHub. You can view the code, contribute improvements, report issues, or fork the project for your own use.',
  viewOnGitHub: 'View on GitHub',
  ready: 'Ready',
  requiresApiKey: 'Requires API Key',
  
  // AI Provider Settings - NEW TRANSLATIONS
  aiProvider: 'AI Provider',
  providerConfiguration: 'Provider Configuration',
  invalidConfiguration: 'Invalid Configuration',
  invalidApiKeyFormat: 'Invalid API key format',
  costTier: 'Cost Tier',
  recommended: 'Recommended',
  
  // Setup Instructions
  setupInstructions: 'Setup Instructions',
  howToGetKey: 'How to get your API key:',
  
  // Configuration Fields
  baseUrl: 'Base URL',
  baseUrlPlaceholder: 'http://localhost:11434/v1',
  model: 'Model',
  modelInputHelp: 'Type any model ID your provider supports, or pick a suggestion below.',
  suggestedModels: 'Suggested models',
  
  // Data Management
  manageYourData: 'Manage your Studorama data and privacy',
  deleteAllData: 'Delete All Data',
  deleteAllDataConfirm: 'Are you sure you want to delete ALL your Studorama data? This includes sessions, settings, API keys, and preferences.',
  deleteAllDataDesc: 'Permanently delete all your study sessions, settings, API keys, and preferences',
  
  // Language Switch Modal
  cancel: 'Cancel',
  
  // Pricing
  supportStudorama: 'Support Studorama',
  supportStudoramaDesc: 'Studorama is completely free to use and always will be. Your sponsorship helps us maintain and improve the platform for everyone.',
  freeForever: 'Free app • Bring your own AI key',
  freeForeverDesc: 'Every feature is free and no account is required. AI requests are billed by your own provider, or cost nothing with a local Ollama model. Sponsorships keep the app free.',
  noAccountRequired: 'No Account Required!',
  startLearningImmediately: 'Start learning immediately',
  noAccountRequiredDesc: 'Studorama works completely without creating an account. Your study sessions are saved locally in your browser. All AI-powered features, spaced repetition, and learning techniques are available instantly.',
  whySponsorStudorama: 'Why Sponsor Studorama?',
  keepItFree: 'Keep It Free',
  keepItFreeDesc: 'Help us maintain Studorama as a completely free, accountless platform for all learners worldwide.',
  fundDevelopment: 'Fund Development',
  fundDevelopmentDesc: 'Support ongoing development of new features and improvements to enhance learning.',
  serverCosts: 'Server Costs',
  serverCostsDesc: 'Cover hosting, AI API costs, and infrastructure to keep the platform running smoothly.',
  privacyFirst: 'Privacy First',
  privacyFirstDesc: 'Support a platform that respects privacy by not requiring accounts or collecting personal data.',
  privacyFocused: 'Privacy Focused',
  dataStaysInBrowser: 'Sessions and keys are stored in your browser',
  noTrackingOrAnalytics: 'No tracking or analytics',
  completeAnonymity: 'Complete anonymity',
  transparencyTrust: 'Transparency & Trust',
  transparencyTrustDesc: 'Your sponsorship goes directly to: hosting costs, development time, and platform maintenance. AI usage is billed by the provider you choose to the API key you configure. We believe in keeping education accessible to everyone, regardless of their financial situation or willingness to create accounts. Studorama will always remain free and accountless.',
  
  // Theme Support
  theme: 'Theme',
  selectTheme: 'Select Theme',
  
  // API Key Notifications
  apiKeyConfigured: 'API Key Configured',
  apiKeyConfiguredDesc: 'API key has been automatically configured from URL',
  invalidApiKey: 'Invalid API Key',
  invalidApiKeyDesc: 'The API key in the URL is not valid. Please check the format.',
  apiKeyUnknownProvider: 'Unknown provider "{provider}" in the link. Supported providers: {providers}.',

  // Storage
  storageWriteFailed: 'Could not save your data',
  storageWriteFailedDesc: 'Browser storage is full or unavailable, so recent changes will be lost when you reload. Delete old sessions in Settings to free space.',
  
  // Version Control
  appUpdated: 'Studorama Updated!',
  versionUpdated: 'Updated from v{oldVersion} to v{newVersion}',
  dataRefreshed: 'Your API keys and provider settings, study sessions, language and theme were kept. Other cached data was cleared.',
  
  // AI errors
  aiErrorMissingApiKey: 'Add an API key for your AI provider in Settings.',
  aiErrorMissingContext: 'Please add at least one study context.',
  aiErrorInvalidConfig: 'Your AI provider settings are incomplete. Check the API key, model and URL in Settings.',
  aiErrorInvalidApiKey: 'The AI provider rejected your API key. Check it in Settings.',
  aiErrorRateLimited: 'The AI provider is limiting requests or your quota is used up. Wait a moment and try again.',
  aiErrorProvider: 'The AI provider returned an error.',
  aiErrorInvalidResponse: 'The AI returned an answer Studorama could not use. Try again.',
  aiErrorNetwork: 'Could not reach the AI provider. Check your internet connection.',
  aiErrorOllamaConnection: 'Cannot connect to Ollama. Make sure Ollama is running and accessible.',
  aiErrorTimeout: 'The AI provider took too long to answer. Try again.',
  aiErrorUnknown: 'Something went wrong with the AI request. Try again.',

  // Badges
  freeAppBadgeShort: 'Free app • Your AI key',
  dashboardBadge: 'No account • Free app • Bring your own AI key',

  // Common
  error: 'Error',
  delete: 'Delete',
  edit: 'Edit',
  save: 'Save'
};
