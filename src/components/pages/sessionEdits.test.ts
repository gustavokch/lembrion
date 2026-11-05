import { describe, expect, it } from 'vitest';
import { LearningSettings, StudySession } from '../../types';
import { applySessionEdit, applySessionEditById } from './sessionEdits';

const settings: LearningSettings = {
  spacedRepetition: true,
  interleaving: true,
  elaborativeInterrogation: true,
  selfExplanation: true,
  desirableDifficulties: true,
};

function makeSession(): StudySession {
  return {
    id: '1700000000000',
    contexts: ['Biology'],
    createdAt: '2026-01-01T00:00:00.000Z',
    questions: [],
    status: 'active',
    score: 0,
    totalQuestions: 0,
    learningSettings: settings,
    contextsHistory: [
      { id: 'old', previousContexts: [], newContexts: ['Biology'], changedAt: '2026-01-01T00:00:00.000Z' },
    ],
    learningSettingsHistory: [
      { id: 'old', previousSettings: settings, newSettings: settings, changedAt: '2026-01-01T00:00:00.000Z' },
    ],
  };
}

describe('applySessionEdit', () => {
  it('appends history entries without mutating the previous session', () => {
    const session = makeSession();
    const snapshot = JSON.parse(JSON.stringify(session));
    const newSettings = { ...settings, interleaving: false };

    const updated = applySessionEdit(
      session,
      { contexts: ['Chemistry'], learningSettings: newSettings },
      '2026-02-01T00:00:00.000Z',
      () => 'new-id'
    );

    expect(session).toEqual(snapshot);
    expect(session.contextsHistory).toHaveLength(1);
    expect(session.learningSettingsHistory).toHaveLength(1);

    expect(updated).not.toBe(session);
    expect(updated.contexts).toEqual(['Chemistry']);
    expect(updated.contextsHistory).toEqual([
      ...snapshot.contextsHistory,
      {
        id: 'new-id',
        previousContexts: ['Biology'],
        newContexts: ['Chemistry'],
        changedAt: '2026-02-01T00:00:00.000Z',
        reason: 'Manual edit from history',
      },
    ]);
    expect(updated.learningSettingsHistory).toEqual([
      ...snapshot.learningSettingsHistory,
      { id: 'new-id', previousSettings: settings, newSettings, changedAt: '2026-02-01T00:00:00.000Z' },
    ]);
  });

  it('does not record a context change when contexts were not edited', () => {
    const session = makeSession();
    const updated = applySessionEdit(session, { enableLatex: true }, '2026-02-01T00:00:00.000Z', () => 'new-id');

    expect(updated.enableLatex).toBe(true);
    expect(updated.contextsHistory).toHaveLength(1);
  });

  it('applies a difficulty change without touching the history', () => {
    const session = makeSession();
    const updated = applySessionEdit(session, { difficulty: 'hard' }, '2026-02-01T00:00:00.000Z', () => 'new-id');

    expect(updated.difficulty).toBe('hard');
    expect(session.difficulty).toBeUndefined();
    expect(updated.contextsHistory).toEqual(session.contextsHistory);
    expect(updated.learningSettingsHistory).toEqual(session.learningSettingsHistory);
  });
});

describe('applySessionEditById', () => {
  it('returns a new array without mutating the edited session or touching others', () => {
    const target = makeSession();
    const other = { ...makeSession(), id: 'other' };
    const sessions = [target, other];

    const result = applySessionEditById(sessions, target.id, { contexts: ['Physics'] }, 'now', () => 'id');

    expect(result).not.toBe(sessions);
    expect(sessions[0]).toBe(target);
    expect(target.contexts).toEqual(['Biology']);
    expect(target.contextsHistory).toHaveLength(1);
    expect(result[0].contextsHistory).toHaveLength(2);
    expect(result[0].contexts).toEqual(['Physics']);
    expect(result[1]).toBe(other);
  });
});
