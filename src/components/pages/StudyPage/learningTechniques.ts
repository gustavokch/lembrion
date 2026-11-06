import { Translations } from '../../../core/types/language.types';
import { Difficulty, LearningSettings, Question } from '../../../types';

/** Levels from easiest to hardest; adaptive steps move one position. */
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

/** Localized name of each level, shared by the setup, edit and details screens. */
export function difficultyLabels(t: Translations): Record<Difficulty, string> {
  return { easy: t.difficultyEasy, medium: t.difficultyMedium, hard: t.difficultyHard };
}

const LEARNING_SETTING_KEYS: readonly (keyof LearningSettings)[] = [
  'spacedRepetition',
  'interleaving',
  'elaborativeInterrogation',
  'selfExplanation',
  'desirableDifficulties',
];

/**
 * Read the known settings from stored data. Missing or non-boolean values default to
 * `true`; keys from older versions (retrievalPractice, generationEffect) are dropped.
 */
export function normalizeLearningSettings(raw?: Partial<LearningSettings>): LearningSettings {
  const settings = {} as LearningSettings;
  for (const key of LEARNING_SETTING_KEYS) {
    const value = raw?.[key];
    settings[key] = typeof value === 'boolean' ? value : true;
  }
  return settings;
}

/**
 * Adaptive difficulty from the answered questions at the `current` level only:
 * the last 3 correct step up, the last 2 wrong step down, otherwise the level stays.
 */
export function nextDifficulty(questions: Question[], current: Difficulty): Difficulty {
  const results = questions
    .filter(q => q.isCorrect !== undefined && (q.difficulty ?? 'medium') === current)
    .map(q => q.isCorrect);
  const index = DIFFICULTIES.indexOf(current);

  if (results.length >= 3 && results.slice(-3).every(Boolean)) {
    return DIFFICULTIES[Math.min(index + 1, DIFFICULTIES.length - 1)];
  }
  if (results.length >= 2 && results.slice(-2).every(correct => !correct)) {
    return DIFFICULTIES[Math.max(index - 1, 0)];
  }
  return current;
}

/**
 * The context the next new question focuses on: the one after the context of the last
 * non-review question, wrapping around. Starts at `contexts[0]`, and again when that
 * context is no longer in the list. Returns `undefined` for fewer than 2 contexts.
 */
export function nextFocusContext(questions: Question[], contexts: string[]): string | undefined {
  if (contexts.length < 2) return undefined;

  let lastContext: string | undefined;
  for (let i = questions.length - 1; i >= 0; i--) {
    if (questions[i].reviewOf === undefined) {
      lastContext = questions[i].context;
      break;
    }
  }

  const lastIndex = lastContext === undefined ? -1 : contexts.indexOf(lastContext);
  return lastIndex === -1 ? contexts[0] : contexts[(lastIndex + 1) % contexts.length];
}

/** Correct answers with a confidence at or below this (on the 1-5 scale) are reviewed like misses. */
export const LOW_CONFIDENCE_MAX = 2;

/** A question counts as answered once it has a correct/incorrect verdict. */
export function isAnswered(question: Question): boolean {
  return typeof question.isCorrect === 'boolean';
}

/** Number of answered questions, review copies included. */
export function answeredCount(questions: Question[]): number {
  return questions.filter(isAnswered).length;
}

/**
 * Session score in percent: correct answers over answered questions, rounded.
 * Review copies count as answers; unanswered questions are ignored; 0 when nothing is answered.
 */
export function sessionScore(questions: Question[]): number {
  const answered = answeredCount(questions);
  if (answered === 0) return 0;
  const correct = questions.filter(q => q.isCorrect === true).length;
  return Math.round((correct / answered) * 100);
}

/** Answered wrong, or correctly with a confidence at most `LOW_CONFIDENCE_MAX`. */
export function needsReview(question: Question): boolean {
  if (question.isCorrect === false) return true;
  return question.isCorrect === true && question.confidence !== undefined && question.confidence <= LOW_CONFIDENCE_MAX;
}

/**
 * The oldest original question whose latest attempt (the original or its last review
 * copy) was answered wrong, or correctly with confidence at most `LOW_CONFIDENCE_MAX`,
 * with at least `gap` questions after that attempt and fewer than `maxReviews` review copies.
 */
export function findDueReview(questions: Question[], gap = 3, maxReviews = 2): Question | undefined {
  return questions.find(original => {
    if (original.reviewOf !== undefined) return false;

    let latestIndex = questions.indexOf(original);
    let copies = 0;
    questions.forEach((q, i) => {
      if (q.reviewOf === original.id) {
        copies++;
        latestIndex = i;
      }
    });

    return (
      copies < maxReviews &&
      needsReview(questions[latestIndex]) &&
      questions.length - 1 - latestIndex >= gap
    );
  });
}

/**
 * A fresh, unanswered copy of `original` for review. Multiple-choice options are
 * shuffled with `random` (values in [0, 1)) and `correctAnswer` follows its option.
 */
export function createReviewCopy(
  original: Question,
  priorCopies: Question[],
  createId: () => string,
  random: () => number
): Question {
  const copy: Question = {
    id: createId(),
    question: original.question,
    type: original.type,
    correctAnswerText: original.correctAnswerText,
    difficulty: original.difficulty,
    context: original.context,
    evaluationCriteria: original.evaluationCriteria ? [...original.evaluationCriteria] : undefined,
    attempts: 0,
    reviewOf: original.id,
    reviewCount: priorCopies.length + 1,
  };

  const options = original.options;
  if (options) {
    const order = options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    copy.options = order.map(i => options[i]);
    if (original.correctAnswer !== undefined) {
      copy.correctAnswer = order.indexOf(original.correctAnswer);
    }
  }

  return copy;
}
