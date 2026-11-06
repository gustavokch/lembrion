import { Question, ReviewRef, StudySession } from '../../../types';
import { LOW_CONFIDENCE_MAX, needsReview, normalizeLearningSettings } from './learningTechniques';

/** Days until the next review for boxes 1-5 (index 0 is box 1). */
export const REVIEW_INTERVAL_DAYS: readonly number[] = [1, 3, 7, 14, 30];

/** Box of a question that passed box 5 and left the queue. */
export const RETIRED_BOX = REVIEW_INTERVAL_DAYS.length + 1;

/** Most questions one review session holds. */
export const REVIEW_SESSION_SIZE = 20;

const DAY_MS = 24 * 60 * 60 * 1000;

function dueAfter(box: number, now: Date): string {
  return new Date(now.getTime() + REVIEW_INTERVAL_DAYS[box - 1] * DAY_MS).toISOString();
}

/** An original question with a pending review: box 1-5 and a due time. */
function isScheduled(question: Question): boolean {
  return (
    question.reviewOf === undefined &&
    question.reviewBox !== undefined &&
    question.reviewBox >= 1 &&
    question.reviewBox < RETIRED_BOX &&
    question.nextReview !== undefined &&
    !Number.isNaN(Date.parse(question.nextReview))
  );
}

/**
 * Schedule an answered original question for review at box 1, due in 1 day, when it was
 * answered wrong or correctly with low confidence and its session has spaced repetition on.
 * Review copies and questions that already have a box are returned unchanged.
 */
export function enterQueue(question: Question, now: Date, spacedRepetition: boolean): Question {
  if (!spacedRepetition || question.reviewOf !== undefined || question.reviewBox !== undefined) return question;
  if (!needsReview(question)) return question;
  return { ...question, reviewBox: 1, nextReview: dueAfter(1, now) };
}

/**
 * Move a scheduled original after a review answer: correct with confidence above
 * `LOW_CONFIDENCE_MAX` goes up one box (past box 5 it retires), correct with low confidence
 * stays in its box, wrong goes back to box 1. The due time follows the new box.
 */
export function applyReviewResult(question: Question, isCorrect: boolean, confidence: number, now: Date): Question {
  if (!isScheduled(question)) return question;
  const box = question.reviewBox!;

  if (!isCorrect) return { ...question, reviewBox: 1, nextReview: dueAfter(1, now) };
  if (confidence <= LOW_CONFIDENCE_MAX) return { ...question, nextReview: dueAfter(box, now) };
  if (box + 1 >= RETIRED_BOX) return { ...question, reviewBox: RETIRED_BOX, nextReview: undefined };
  return { ...question, reviewBox: box + 1, nextReview: dueAfter(box + 1, now) };
}

/** Scheduled originals due at `now`, oldest due first, at most `limit`. */
export function dueReviews(sessions: StudySession[], now: Date, limit = REVIEW_SESSION_SIZE): ReviewRef[] {
  const due: { ref: ReviewRef; time: number }[] = [];
  for (const session of sessions) {
    for (const question of session.questions) {
      if (!isScheduled(question)) continue;
      const time = Date.parse(question.nextReview!);
      if (time <= now.getTime()) {
        due.push({ ref: { sessionId: session.id, questionId: question.id }, time });
      }
    }
  }
  return due
    .sort((a, b) => a.time - b.time)
    .slice(0, limit)
    .map(item => item.ref);
}

/** Earliest due time among all scheduled questions, due or not; `undefined` when none is scheduled. */
export function nextDueDate(sessions: StudySession[]): string | undefined {
  let earliest: { iso: string; time: number } | undefined;
  for (const session of sessions) {
    for (const question of session.questions) {
      if (!isScheduled(question)) continue;
      const time = Date.parse(question.nextReview!);
      if (!earliest || time < earliest.time) earliest = { iso: question.nextReview!, time };
    }
  }
  return earliest?.iso;
}

/** A scheduled original question with the session that holds it. */
export interface ScheduledReview {
  session: StudySession;
  question: Question;
  /** Leitner box 1-5. */
  box: number;
  /** Due time in ms since the epoch. */
  due: number;
}

/** Every scheduled original (box 1-5 with a due time), due or not, soonest due first. */
export function scheduledReviews(sessions: StudySession[]): ScheduledReview[] {
  const scheduled: ScheduledReview[] = [];
  for (const session of sessions) {
    for (const question of session.questions) {
      if (!isScheduled(question)) continue;
      scheduled.push({ session, question, box: question.reviewBox!, due: Date.parse(question.nextReview!) });
    }
  }
  return scheduled.sort((a, b) => a.due - b.due);
}

/**
 * A new active review session over the questions due at `now`, or `undefined` when none is due.
 * Its contexts are the unique contexts of the source sessions.
 */
export function createReviewSession(
  sessions: StudySession[],
  now: Date,
  createId: () => string,
  limit = REVIEW_SESSION_SIZE
): StudySession | undefined {
  const reviewQueue = dueReviews(sessions, now, limit);
  if (reviewQueue.length === 0) return undefined;

  const contexts: string[] = [];
  for (const ref of reviewQueue) {
    for (const context of sessions.find(s => s.id === ref.sessionId)?.contexts ?? []) {
      if (!contexts.includes(context)) contexts.push(context);
    }
  }

  return {
    id: createId(),
    kind: 'review',
    reviewQueue,
    contexts,
    createdAt: now.toISOString(),
    questions: [],
    status: 'active',
    score: 0,
    totalQuestions: 0,
    // The queue is the spacing, so the in-session spacing, interleaving and adaptive steps are off
    learningSettings: { ...normalizeLearningSettings(), spacedRepetition: false, interleaving: false, desirableDifficulties: false },
    currentQuestionIndex: 0,
  };
}

/**
 * The first ref of `queue` whose source question still exists and is still due at `now`, and the
 * refs after it. Missing sources and questions already reviewed elsewhere (no longer due) are
 * skipped; `next` is `undefined` when nothing is left.
 */
export function takeNextReview(
  sessions: StudySession[],
  queue: ReviewRef[],
  now: Date
): { next?: { sourceSessionId: string; original: Question }; remaining: ReviewRef[] } {
  for (let i = 0; i < queue.length; i++) {
    const ref = queue[i];
    const original = sessions.find(s => s.id === ref.sessionId)?.questions.find(q => q.id === ref.questionId);
    if (original && isScheduled(original) && Date.parse(original.nextReview!) <= now.getTime()) {
      return { next: { sourceSessionId: ref.sessionId, original }, remaining: queue.slice(i + 1) };
    }
  }
  return { remaining: [] };
}

/** The newest active review session that still has a due question to show, so it can be resumed. */
export function findOpenReviewSession(sessions: StudySession[], now: Date): StudySession | undefined {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const session = sessions[i];
    if (session.kind !== 'review' || session.status !== 'active') continue;
    if (takeNextReview(sessions, session.reviewQueue ?? [], now).next) return session;
  }
  return undefined;
}

/** `sessions` with the original question of a review answer moved by `applyReviewResult`. */
export function recordReviewResult(
  sessions: StudySession[],
  ref: ReviewRef,
  isCorrect: boolean,
  confidence: number,
  now: Date
): StudySession[] {
  return sessions.map(session =>
    session.id !== ref.sessionId
      ? session
      : {
          ...session,
          questions: session.questions.map(q => (q.id === ref.questionId ? applyReviewResult(q, isCorrect, confidence, now) : q)),
        }
  );
}
