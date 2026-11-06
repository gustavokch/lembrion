import { describe, expect, it } from 'vitest';
import { Question, StudySession } from '../../../types';
import { LOW_CONFIDENCE_MAX } from './learningTechniques';
import {
  applyReviewResult,
  createReviewSession,
  dueReviews,
  enterQueue,
  findOpenReviewSession,
  nextDueDate,
  recordReviewResult,
  RETIRED_BOX,
  REVIEW_SESSION_SIZE,
  scheduledReviews,
  takeNextReview,
} from './reviewSchedule';

const NOW = new Date('2026-11-05T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function daysFrom(date: Date, days: number): string {
  return new Date(date.getTime() + days * DAY_MS).toISOString();
}

let nextId = 0;

function q(patch: Partial<Question> = {}): Question {
  nextId++;
  return { id: `q${nextId}`, question: `Question ${nextId}`, type: 'multipleChoice', attempts: 1, ...patch };
}

/** A question in `box`, due `days` from NOW (negative = overdue). */
function scheduled(box: number, days: number, patch: Partial<Question> = {}): Question {
  return q({ isCorrect: false, reviewBox: box, nextReview: daysFrom(NOW, days), ...patch });
}

function session(id: string, questions: Question[], patch: Partial<StudySession> = {}): StudySession {
  return {
    id,
    contexts: [`Context ${id}`],
    createdAt: NOW.toISOString(),
    questions,
    status: 'completed',
    score: 0,
    totalQuestions: questions.length,
    ...patch,
  };
}

describe('enterQueue', () => {
  it('schedules a wrong answer at box 1, due in 1 day', () => {
    const entered = enterQueue(q({ isCorrect: false, confidence: 5 }), NOW, true);
    expect(entered.reviewBox).toBe(1);
    expect(entered.nextReview).toBe(daysFrom(NOW, 1));
  });

  it('schedules a correct answer with low confidence', () => {
    const entered = enterQueue(q({ isCorrect: true, confidence: LOW_CONFIDENCE_MAX }), NOW, true);
    expect(entered.reviewBox).toBe(1);
    expect(entered.nextReview).toBe(daysFrom(NOW, 1));
  });

  it('leaves a correct answer with high confidence out', () => {
    const question = q({ isCorrect: true, confidence: LOW_CONFIDENCE_MAX + 1 });
    expect(enterQueue(question, NOW, true)).toEqual(question);
  });

  it('leaves questions out when the session has spaced repetition off', () => {
    const question = q({ isCorrect: false, confidence: 1 });
    expect(enterQueue(question, NOW, false)).toEqual(question);
  });

  it('keeps the schedule of a question already in the queue', () => {
    const question = scheduled(3, 4);
    expect(enterQueue(question, NOW, true)).toEqual(question);
  });

  it('keeps a retired question retired', () => {
    const question = q({ isCorrect: false, reviewBox: RETIRED_BOX });
    expect(enterQueue(question, NOW, true)).toEqual(question);
  });

  it('never schedules a review copy', () => {
    const copy = q({ isCorrect: false, reviewOf: 'q-original' });
    expect(enterQueue(copy, NOW, true)).toEqual(copy);
  });

  it('ignores unanswered questions', () => {
    const question = q({ attempts: 0 });
    expect(enterQueue(question, NOW, true)).toEqual(question);
  });
});

describe('applyReviewResult', () => {
  it('moves up one box after a confident correct answer', () => {
    const moved = applyReviewResult(scheduled(1, 0), true, 4, NOW);
    expect(moved.reviewBox).toBe(2);
    expect(moved.nextReview).toBe(daysFrom(NOW, 3));
  });

  it('stays in the box after a correct answer with low confidence', () => {
    const moved = applyReviewResult(scheduled(3, -2), true, LOW_CONFIDENCE_MAX, NOW);
    expect(moved.reviewBox).toBe(3);
    expect(moved.nextReview).toBe(daysFrom(NOW, 7));
  });

  it('goes back to box 1 after a wrong answer', () => {
    const moved = applyReviewResult(scheduled(4, 0), false, 5, NOW);
    expect(moved.reviewBox).toBe(1);
    expect(moved.nextReview).toBe(daysFrom(NOW, 1));
  });

  it('uses the 1, 3, 7, 14 and 30 day intervals', () => {
    const days = [1, 2, 3, 4].map(box => (Date.parse(applyReviewResult(scheduled(box, 0), true, 3, NOW).nextReview!) - NOW.getTime()) / DAY_MS);
    expect(days).toEqual([3, 7, 14, 30]);
    const lowConfidence = [1, 2, 3, 4, 5].map(box => (Date.parse(applyReviewResult(scheduled(box, 0), true, 1, NOW).nextReview!) - NOW.getTime()) / DAY_MS);
    expect(lowConfidence).toEqual([1, 3, 7, 14, 30]);
  });

  it('counts the interval from the answer time, not from the old due time', () => {
    const overdue = scheduled(2, -10);
    expect(applyReviewResult(overdue, true, 5, NOW).nextReview).toBe(daysFrom(NOW, 7));
  });

  it('retires a question that passes box 5', () => {
    const retired = applyReviewResult(scheduled(5, 0), true, 5, NOW);
    expect(retired.reviewBox).toBe(RETIRED_BOX);
    expect(retired.nextReview).toBeUndefined();
  });

  it('keeps box 5 after a low-confidence correct answer', () => {
    const moved = applyReviewResult(scheduled(5, 0), true, 2, NOW);
    expect(moved.reviewBox).toBe(5);
    expect(moved.nextReview).toBe(daysFrom(NOW, 30));
  });

  it('leaves questions outside the queue unchanged', () => {
    const plain = q({ isCorrect: false });
    const retired = q({ reviewBox: RETIRED_BOX });
    expect(applyReviewResult(plain, false, 1, NOW)).toEqual(plain);
    expect(applyReviewResult(retired, false, 1, NOW)).toEqual(retired);
  });
});

describe('dueReviews', () => {
  it('returns the due questions oldest due first, across sessions', () => {
    const late = scheduled(1, -1);
    const oldest = scheduled(2, -5);
    const exactlyNow = scheduled(1, 0);
    const future = scheduled(1, 1);
    const sessions = [session('a', [late, future]), session('b', [exactlyNow, oldest])];

    expect(dueReviews(sessions, NOW)).toEqual([
      { sessionId: 'b', questionId: oldest.id },
      { sessionId: 'a', questionId: late.id },
      { sessionId: 'b', questionId: exactlyNow.id },
    ]);
  });

  it(`takes at most ${REVIEW_SESSION_SIZE} by default, and the given limit`, () => {
    const questions = Array.from({ length: REVIEW_SESSION_SIZE + 5 }, (_, i) => scheduled(1, -(i + 1)));
    const sessions = [session('a', questions)];

    const due = dueReviews(sessions, NOW);
    expect(due).toHaveLength(REVIEW_SESSION_SIZE);
    expect(due[0].questionId).toBe(questions[questions.length - 1].id);
    expect(dueReviews(sessions, NOW, 3)).toHaveLength(3);
    expect(dueReviews(sessions, NOW, Infinity)).toHaveLength(REVIEW_SESSION_SIZE + 5);
  });

  it('skips retired, unscheduled questions and review copies', () => {
    const sessions = [
      session('a', [
        q({ isCorrect: false }),
        q({ reviewBox: RETIRED_BOX }),
        scheduled(1, -1, { reviewOf: 'q-original' }),
      ]),
    ];
    expect(dueReviews(sessions, NOW)).toEqual([]);
  });
});

describe('scheduledReviews', () => {
  it('lists due and future originals soonest first, skipping retired questions and review copies', () => {
    const overdue = scheduled(2, -3);
    const later = scheduled(4, 9);
    const today = scheduled(1, 0);
    const sessions = [
      session('a', [later, q({ reviewBox: RETIRED_BOX }), overdue]),
      session('b', [today, scheduled(1, -1, { reviewOf: 'x' }), q()]),
    ];

    const list = scheduledReviews(sessions);
    expect(list.map(entry => [entry.session.id, entry.question.id, entry.box])).toEqual([
      ['a', overdue.id, 2],
      ['b', today.id, 1],
      ['a', later.id, 4],
    ]);
    expect(list[0].due).toBe(Date.parse(overdue.nextReview!));
  });
});

describe('nextDueDate', () => {
  it('returns the earliest due time, due or not', () => {
    const soon = scheduled(1, 2);
    const sessions = [session('a', [scheduled(3, 6)]), session('b', [soon, q({ reviewBox: RETIRED_BOX })])];
    expect(nextDueDate(sessions)).toBe(soon.nextReview);
  });

  it('includes overdue questions', () => {
    const overdue = scheduled(1, -3);
    expect(nextDueDate([session('a', [scheduled(1, 1), overdue])])).toBe(overdue.nextReview);
  });

  it('is undefined when nothing is scheduled', () => {
    expect(nextDueDate([session('a', [q({ isCorrect: false }), q({ reviewBox: RETIRED_BOX })])])).toBeUndefined();
    expect(nextDueDate([])).toBeUndefined();
  });
});

describe('createReviewSession', () => {
  it('builds an active review session over the due questions with the unique source contexts', () => {
    const first = scheduled(1, -2);
    const second = scheduled(1, -1);
    const third = scheduled(1, -3);
    const sessions = [
      session('a', [first], { contexts: ['Algebra', 'Geometry'] }),
      session('b', [second], { contexts: ['Geometry', 'Biology'] }),
      session('c', [third], { contexts: ['Algebra'] }),
      session('d', [scheduled(1, 3)], { contexts: ['History'] }),
    ];

    const review = createReviewSession(sessions, NOW, () => 'review-1')!;

    expect(review.id).toBe('review-1');
    expect(review.kind).toBe('review');
    expect(review.status).toBe('active');
    expect(review.questions).toEqual([]);
    expect(review.reviewQueue).toEqual([
      { sessionId: 'c', questionId: third.id },
      { sessionId: 'a', questionId: first.id },
      { sessionId: 'b', questionId: second.id },
    ]);
    expect(review.contexts).toEqual(['Algebra', 'Geometry', 'Biology']);
    expect(review.learningSettings).toEqual({
      spacedRepetition: false,
      interleaving: false,
      elaborativeInterrogation: true,
      selfExplanation: true,
      desirableDifficulties: false,
    });
  });

  it('is undefined when nothing is due', () => {
    expect(createReviewSession([session('a', [scheduled(1, 1)])], NOW, () => 'x')).toBeUndefined();
  });
});

describe('takeNextReview', () => {
  it('takes the first ref and keeps the rest', () => {
    const first = scheduled(1, -1);
    const second = scheduled(1, -1);
    const sessions = [session('a', [first, second])];
    const queue = [
      { sessionId: 'a', questionId: first.id },
      { sessionId: 'a', questionId: second.id },
    ];

    expect(takeNextReview(sessions, queue, NOW)).toEqual({
      next: { sourceSessionId: 'a', original: first },
      remaining: [queue[1]],
    });
  });

  it('skips refs whose session or question no longer exists', () => {
    const kept = scheduled(1, -1);
    const sessions = [session('a', [kept])];
    const queue = [
      { sessionId: 'deleted', questionId: 'q-gone' },
      { sessionId: 'a', questionId: 'q-removed' },
      { sessionId: 'a', questionId: kept.id },
    ];

    expect(takeNextReview(sessions, queue, NOW)).toEqual({ next: { sourceSessionId: 'a', original: kept }, remaining: [] });
  });

  it('skips questions already reviewed elsewhere (no longer due or retired)', () => {
    const movedOn = scheduled(2, 3);
    const retired = q({ reviewBox: RETIRED_BOX });
    const due = scheduled(1, 0);
    const sessions = [session('a', [movedOn, retired, due])];
    const queue = [movedOn, retired, due].map(question => ({ sessionId: 'a', questionId: question.id }));

    expect(takeNextReview(sessions, queue, NOW)).toEqual({ next: { sourceSessionId: 'a', original: due }, remaining: [] });
  });

  it('has nothing next when every source is missing or the queue is empty', () => {
    expect(takeNextReview([], [{ sessionId: 'deleted', questionId: 'q-gone' }], NOW)).toEqual({ remaining: [] });
    expect(takeNextReview([], [], NOW)).toEqual({ remaining: [] });
  });
});

describe('findOpenReviewSession', () => {
  it('returns the newest active review session that still has a due question', () => {
    const due = scheduled(1, -1);
    const source = session('src', [due]);
    const ref = [{ sessionId: 'src', questionId: due.id }];
    const older = session('r1', [], { kind: 'review', status: 'active', reviewQueue: ref });
    const newer = session('r2', [], { kind: 'review', status: 'active', reviewQueue: ref });

    expect(findOpenReviewSession([source, older, newer], NOW)?.id).toBe('r2');
  });

  it('ignores completed, normal, and exhausted review sessions', () => {
    const notDue = scheduled(1, 2);
    const due = scheduled(1, -1);
    const source = session('src', [notDue, due]);
    const sessions = [
      source,
      session('done', [], { kind: 'review', status: 'completed', reviewQueue: [{ sessionId: 'src', questionId: due.id }] }),
      session('normal', [], { status: 'active' }),
      session('stale', [], { kind: 'review', status: 'active', reviewQueue: [{ sessionId: 'src', questionId: notDue.id }] }),
    ];

    expect(findOpenReviewSession(sessions, NOW)).toBeUndefined();
  });
});

describe('recordReviewResult', () => {
  it('moves only the original question in its source session', () => {
    const original = scheduled(1, 0);
    const other = scheduled(1, 0);
    const sessions = [session('a', [original, other]), session('b', [scheduled(2, 0)])];

    const updated = recordReviewResult(sessions, { sessionId: 'a', questionId: original.id }, true, 4, NOW);

    expect(updated[0].questions[0].reviewBox).toBe(2);
    expect(updated[0].questions[0].nextReview).toBe(daysFrom(NOW, 3));
    expect(updated[0].questions[1]).toBe(other);
    expect(updated[1]).toBe(sessions[1]);
    expect(sessions[0].questions[0].reviewBox).toBe(1);
  });

  it('leaves the sessions unchanged when the source is gone', () => {
    const sessions = [session('a', [scheduled(1, 0)])];
    expect(recordReviewResult(sessions, { sessionId: 'deleted', questionId: 'q-gone' }, false, 1, NOW)).toEqual(sessions);
  });
});
