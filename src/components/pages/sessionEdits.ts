import { createId as defaultCreateId } from '../../core/utils/id';
import { LearningSettings, StudySession } from '../../types';

export type SessionEditUpdates = Partial<
  Pick<
    StudySession,
    'contexts' | 'instructions' | 'learningSettings' | 'difficulty' | 'questionType' | 'enableLatex' | 'enableCodeVisualization'
  >
>;

/**
 * Return a new session with `updates` applied and history entries appended for
 * context and learning-settings changes. Never mutates `session` or its arrays.
 */
export function applySessionEdit(
  session: StudySession,
  updates: SessionEditUpdates,
  now: string = new Date().toISOString(),
  createId: () => string = defaultCreateId
): StudySession {
  const updatedSession: StudySession = { ...session, ...updates };

  if (updates.contexts !== undefined && updates.contexts !== session.contexts) {
    updatedSession.contextsHistory = [
      ...(session.contextsHistory ?? []),
      {
        id: createId(),
        newContexts: updates.contexts,
        previousContexts: session.contexts,
        changedAt: now,
        reason: 'Manual edit from history',
      },
    ];
  }

  if (updates.learningSettings && JSON.stringify(updates.learningSettings) !== JSON.stringify(session.learningSettings)) {
    updatedSession.learningSettingsHistory = [
      ...(session.learningSettingsHistory ?? []),
      {
        id: createId(),
        previousSettings: session.learningSettings as LearningSettings,
        newSettings: updates.learningSettings,
        changedAt: now,
      },
    ];
  }

  return updatedSession;
}

/** Apply `updates` to the session with `sessionId`, returning a new array. */
export function applySessionEditById(
  sessions: StudySession[],
  sessionId: string,
  updates: SessionEditUpdates,
  now?: string,
  createId?: () => string
): StudySession[] {
  return sessions.map(session =>
    session.id === sessionId ? applySessionEdit(session, updates, now, createId) : session
  );
}
