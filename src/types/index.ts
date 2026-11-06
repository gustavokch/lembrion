// custom-types.d.ts
import 'react';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
  // Declaration merging requires the original type parameter name.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    inline?: boolean;
  }
}

export type Difficulty = 'easy' | 'medium' | 'hard';

/** One due question picked for a review session: the original question and the session that holds it. */
export interface ReviewRef {
  sessionId: string;
  questionId: string;
}

export interface StudySession {
  id: string;
  contexts: string[]; // List of study contexts (minimum 1)
  instructions?: string[]; // Optional special instructions
  createdAt: string;
  questions: Question[];
  status: 'active' | 'completed';
  score: number;
  totalQuestions: number;
  questionType?: 'multipleChoice' | 'dissertative' | 'mixed';
  learningSettings?: LearningSettings;
  difficulty?: Difficulty; // Current level; missing means 'medium'
  kind?: 'review'; // Review session across sessions; missing means a normal session
  reviewQueue?: ReviewRef[]; // Review sessions only: due questions not shown yet, oldest due first
  currentQuestionIndex?: number; // Track which question the user was on
  enableLatex?: boolean; // LaTeX visualization option
  enableCodeVisualization?: boolean; // Code visualization option
  
  // Enhanced session state preservation
  sessionState?: SessionState;
  
  // Session history tracking
  contextsHistory?: ContextsHistoryEntry[];
  instructionHistory?: InstructionHistoryEntry[];
  learningSettingsHistory?: LearningSettingsHistoryEntry[];
}

export interface SessionState {
  currentUserAnswer?: string | number;
  currentConfidence?: number;
  showFeedback?: boolean;
  showElaborative?: boolean;
  showSelfExplanation?: boolean;
  elaborativeQuestion?: string;
  elaborativeAnswer?: string;
  selfExplanationAnswer?: string;
  isEvaluating?: boolean;
  lastSavedAt: string;
}

export interface ContextsHistoryEntry {
  id: string;
  previousContexts: string[];
  newContexts: string[];
  changedAt: string;
  reason?: string;
}

export interface InstructionHistoryEntry {
  id: string;
  action: 'added' | 'removed';
  instruction: string;
  previousValue?: string;
  changedAt: string;
}

export interface LearningSettingsHistoryEntry {
  id: string;
  previousSettings: LearningSettings;
  newSettings: LearningSettings;
  changedAt: string;
}

export interface Question {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: number;
  userAnswer?: number | string;
  isCorrect?: boolean;
  attempts: number;
  feedback?: string;
  type: 'multipleChoice' | 'dissertative';
  correctAnswerText?: string;
  aiEvaluation?: string;
  difficulty?: Difficulty; // The level requested, not the model's echo
  context?: string; // Interleaving focus context
  reviewOf?: string; // Id of the missed question this repeats
  sourceSessionId?: string; // Review-session copies: the session that holds the original question
  reviewBox?: number; // Review queue (originals only): Leitner box 1-5 while scheduled; 6 = retired
  nextReview?: string; // Review queue: ISO time the question is due; unset when retired or never scheduled
  reviewCount?: number; // 1 for the first review copy, 2 for the second
  evaluationCriteria?: string[];
  score?: number; // 0-100, dissertative only
  confidence?: number; // 1-5 scale
  elaborativeQuestion?: string;
  elaborativeAnswer?: string;
  selfExplanation?: string;
  selfExplanationFeedback?: string; // AI feedback on `selfExplanation`, Markdown
  
  // Question timing
  timeSpent?: number; // in ms
  startedAt?: string;
  completedAt?: string;
  timedOut?: boolean;
}

export interface LearningSettings {
  spacedRepetition: boolean;
  interleaving: boolean;
  elaborativeInterrogation: boolean;
  selfExplanation: boolean;
  desirableDifficulties: boolean;
}

export interface LearningTechniquesPreference {
  rememberChoice: boolean;
  defaultSettings: LearningSettings;
}
