import { describe, expect, it } from 'vitest';
import { Difficulty, Question } from '../../../types';
import {
  createReviewCopy,
  findDueReview,
  LOW_CONFIDENCE_MAX,
  nextDifficulty,
  nextFocusContext,
  normalizeLearningSettings,
  sessionScore,
} from './learningTechniques';

let nextId = 0;

function q(patch: Partial<Question> = {}): Question {
  nextId++;
  return { id: `q${nextId}`, question: `Question ${nextId}`, type: 'multipleChoice', attempts: 1, ...patch };
}

function answered(isCorrect: boolean, difficulty: Difficulty = 'medium', patch: Partial<Question> = {}): Question {
  return q({ isCorrect, difficulty, ...patch });
}

describe('normalizeLearningSettings', () => {
  it('defaults missing keys to true and drops removed keys', () => {
    const stored = { interleaving: false, retrievalPractice: false, generationEffect: true } as unknown as Parameters<typeof normalizeLearningSettings>[0];
    expect(normalizeLearningSettings(stored)).toEqual({
      spacedRepetition: true,
      interleaving: false,
      elaborativeInterrogation: true,
      selfExplanation: true,
      desirableDifficulties: true,
    });
  });

  it('turns every technique on when nothing is stored', () => {
    expect(Object.values(normalizeLearningSettings(undefined))).toEqual([true, true, true, true, true]);
  });
});

describe('nextDifficulty', () => {
  it('steps up after 3 correct answers in a row', () => {
    expect(nextDifficulty([answered(true), answered(true)], 'medium')).toBe('medium');
    expect(nextDifficulty([answered(true), answered(true), answered(true)], 'medium')).toBe('hard');
  });

  it('steps down after 2 wrong answers in a row', () => {
    expect(nextDifficulty([answered(true), answered(false)], 'medium')).toBe('medium');
    expect(nextDifficulty([answered(true), answered(false), answered(false)], 'medium')).toBe('easy');
  });

  it('stays at hard and at easy', () => {
    expect(nextDifficulty([answered(true, 'hard'), answered(true, 'hard'), answered(true, 'hard')], 'hard')).toBe('hard');
    expect(nextDifficulty([answered(false, 'easy'), answered(false, 'easy')], 'easy')).toBe('easy');
  });

  it('restarts the streak after a step in a mixed-level history', () => {
    const steppedUp = [answered(true, 'medium'), answered(true, 'medium'), answered(true, 'medium')];
    // The medium successes do not carry over, and an unanswered question is ignored
    expect(nextDifficulty([...steppedUp, answered(true, 'hard'), q({ difficulty: 'hard' })], 'hard')).toBe('hard');

    const steppedDown = [...steppedUp, answered(true, 'hard'), answered(false, 'hard'), answered(false, 'hard')];
    expect(nextDifficulty(steppedDown, 'hard')).toBe('medium');
    // Back at medium, one miss after the old streak keeps the level
    expect(nextDifficulty([...steppedDown, answered(false, 'medium')], 'medium')).toBe('medium');
    expect(nextDifficulty([...steppedDown, answered(false, 'medium'), answered(true, 'medium')], 'medium')).toBe('medium');
  });

  it('treats questions without a level as medium', () => {
    expect(nextDifficulty([q({ isCorrect: false }), q({ isCorrect: false })], 'medium')).toBe('easy');
  });
});

describe('nextFocusContext', () => {
  const contexts = ['Algebra', 'Geometry', 'Calculus'];

  it('returns undefined for fewer than 2 contexts', () => {
    expect(nextFocusContext([], [])).toBeUndefined();
    expect(nextFocusContext([q({ context: 'Algebra' })], ['Algebra'])).toBeUndefined();
  });

  it('starts at the first context', () => {
    expect(nextFocusContext([], contexts)).toBe('Algebra');
  });

  it('rotates and wraps around', () => {
    expect(nextFocusContext([q({ context: 'Algebra' })], contexts)).toBe('Geometry');
    expect(nextFocusContext([q({ context: 'Algebra' }), q({ context: 'Geometry' })], contexts)).toBe('Calculus');
    expect(nextFocusContext([q({ context: 'Calculus' })], contexts)).toBe('Algebra');
  });

  it('restarts at the first context when the last one was removed', () => {
    expect(nextFocusContext([q({ context: 'Topology' })], contexts)).toBe('Algebra');
  });

  it('skips review copies', () => {
    const original = q({ context: 'Geometry' });
    const review = q({ context: 'Algebra', reviewOf: original.id });
    expect(nextFocusContext([original, review], contexts)).toBe('Calculus');
  });
});

describe('findDueReview', () => {
  it('is due exactly at the gap and not before', () => {
    const missed = answered(false);
    expect(findDueReview([missed, answered(true), answered(true)])).toBeUndefined();
    expect(findDueReview([missed, answered(true), answered(true), answered(true)])).toBe(missed);
  });

  it('ignores correct and unanswered questions', () => {
    expect(findDueReview([answered(true), q(), answered(true), answered(true), answered(true)])).toBeUndefined();
  });

  it('waits the gap after a wrong review copy and stops at the cap', () => {
    const missed = answered(false);
    const firstCopy = answered(false, 'medium', { reviewOf: missed.id, reviewCount: 1 });
    const afterFirst = [missed, answered(true), answered(true), answered(true), firstCopy];
    expect(findDueReview(afterFirst)).toBeUndefined();
    expect(findDueReview([...afterFirst, answered(true), answered(true)])).toBeUndefined();
    const dueAgain = [...afterFirst, answered(true), answered(true), answered(true)];
    expect(findDueReview(dueAgain)).toBe(missed);

    const secondCopy = answered(false, 'medium', { reviewOf: missed.id, reviewCount: 2 });
    expect(findDueReview([...dueAgain, secondCopy, answered(true), answered(true), answered(true)])).toBeUndefined();
  });

  it('ends the cycle when a review copy is answered correctly', () => {
    const missed = answered(false);
    const copy = answered(true, 'medium', { reviewOf: missed.id, reviewCount: 1 });
    expect(findDueReview([missed, answered(true), answered(true), answered(true), copy, answered(true), answered(true), answered(true)])).toBeUndefined();
  });

  it('returns the oldest due question first', () => {
    const first = answered(false);
    const second = answered(false);
    expect(findDueReview([first, second, answered(true), answered(true), answered(true)])).toBe(first);
  });

  it('reviews a correct answer given with low confidence at the gap', () => {
    const unsure = answered(true, 'medium', { confidence: LOW_CONFIDENCE_MAX });
    expect(findDueReview([unsure, answered(true), answered(true)])).toBeUndefined();
    expect(findDueReview([unsure, answered(true), answered(true), answered(true)])).toBe(unsure);
  });

  it('does not review a correct answer given with confidence 3', () => {
    const fairlySure = answered(true, 'medium', { confidence: 3 });
    expect(findDueReview([fairlySure, answered(true), answered(true), answered(true)])).toBeUndefined();
  });

  it('stops reviewing low-confidence correct answers at the cap', () => {
    const unsure = answered(true, 'medium', { confidence: 1 });
    const firstCopy = answered(true, 'medium', { reviewOf: unsure.id, reviewCount: 1, confidence: 2 });
    const afterFirst = [unsure, answered(true), answered(true), answered(true), firstCopy, answered(true), answered(true), answered(true)];
    expect(findDueReview(afterFirst)).toBe(unsure);

    const secondCopy = answered(true, 'medium', { reviewOf: unsure.id, reviewCount: 2, confidence: 1 });
    expect(findDueReview([...afterFirst, secondCopy, answered(true), answered(true), answered(true)])).toBeUndefined();
  });
});

describe('sessionScore', () => {
  it('is 0 when nothing is answered', () => {
    expect(sessionScore([])).toBe(0);
    expect(sessionScore([q()])).toBe(0);
  });

  it('excludes unanswered questions', () => {
    expect(sessionScore([answered(true), answered(false), q()])).toBe(50);
  });

  it('counts review copies as answers', () => {
    const missed = answered(false);
    const copy = answered(true, 'medium', { reviewOf: missed.id, reviewCount: 1 });
    expect(sessionScore([missed, answered(true), copy])).toBe(67);
  });
});

describe('createReviewCopy', () => {
  const original = q({
    type: 'multipleChoice',
    options: ['Paris', 'Rome', 'Madrid', 'Berlin'],
    correctAnswer: 2,
    userAnswer: 0,
    isCorrect: false,
    feedback: 'Incorrect.',
    confidence: 4,
    difficulty: 'hard',
    context: 'Geography',
    evaluationCriteria: ['Names the capital'],
    elaborativeAnswer: 'Because',
    selfExplanation: 'Since',
  });

  it('keeps options[correctAnswer] the same for any shuffle', () => {
    for (const value of [0, 0.2, 0.5, 0.8, 0.99]) {
      const copy = createReviewCopy(original, [], () => 'copy', () => value);
      expect([...(copy.options ?? [])].sort()).toEqual([...(original.options ?? [])].sort());
      expect(copy.options?.[copy.correctAnswer ?? -1]).toBe('Madrid');
    }
  });

  it('moves the options for a non-identity shuffle', () => {
    const copy = createReviewCopy(original, [], () => 'copy', () => 0);
    expect(copy.options).not.toEqual(original.options);
  });

  it('links to the original, counts copies and clears the answer', () => {
    const prior = [q({ reviewOf: original.id, reviewCount: 1 })];
    const copy = createReviewCopy(original, prior, () => 'copy-2', Math.random);
    expect(copy).toMatchObject({
      id: 'copy-2',
      reviewOf: original.id,
      reviewCount: 2,
      attempts: 0,
      difficulty: 'hard',
      context: 'Geography',
      evaluationCriteria: ['Names the capital'],
    });
    for (const field of ['userAnswer', 'isCorrect', 'feedback', 'confidence', 'score', 'elaborativeAnswer', 'selfExplanation'] as const) {
      expect(copy[field]).toBeUndefined();
    }
  });

  it('copies a dissertative question without options', () => {
    const essay = q({ type: 'dissertative', correctAnswerText: 'Sample', userAnswer: 'Mine', isCorrect: false, score: 40 });
    const copy = createReviewCopy(essay, [], () => 'copy', Math.random);
    expect(copy.options).toBeUndefined();
    expect(copy.correctAnswerText).toBe('Sample');
    expect(copy.score).toBeUndefined();
  });
});
