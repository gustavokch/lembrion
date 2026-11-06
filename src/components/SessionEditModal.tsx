import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatMessage } from '../core/services/i18n';
import { useLanguage } from '../hooks/useLanguage';
import { Difficulty, LearningSettings, StudySession } from '../types';
import { sessionCallNumber, topicCode } from './callNumber';
import { SessionEditUpdates } from './pages/sessionEdits';
import { DIFFICULTIES, difficultyLabels, normalizeLearningSettings } from './pages/StudyPage/learningTechniques';

interface SessionEditModalProps {
  session: StudySession;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: SessionEditUpdates) => void;
}

type QuestionType = 'multipleChoice' | 'dissertative' | 'mixed';

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export default function SessionEditModal({ session, isOpen, onClose, onSave }: SessionEditModalProps) {
  const { t, language } = useLanguage();
  const levelLabels = difficultyLabels(t);
  const panelRef = useRef<HTMLDivElement>(null);

  // Form state
  const [contexts, setContexts] = useState<string[]>(session.contexts || []);
  const [instructions, setInstructions] = useState<string[]>(session.instructions || []);
  const [newContext, setNewContext] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(session.questionType || 'multipleChoice');
  const [enableLatex, setEnableLatex] = useState(session.enableLatex || false);
  const [enableCodeVisualization, setEnableCodeVisualization] = useState(session.enableCodeVisualization || false);
  const [learningSettings, setLearningSettings] = useState<LearningSettings>(() =>
    normalizeLearningSettings(session.learningSettings)
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(session.difficulty ?? 'medium');
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setContexts(session.contexts || []);
      setInstructions(session.instructions || []);
      setQuestionType(session.questionType || 'multipleChoice');
      setEnableLatex(session.enableLatex || false);
      setEnableCodeVisualization(session.enableCodeVisualization || false);
      setLearningSettings(normalizeLearningSettings(session.learningSettings));
      setDifficulty(session.difficulty ?? 'medium');
      setNewContext('');
      setNewInstruction('');
      setHasChanges(false);
    }
  }, [isOpen, session]);

  // Track changes
  useEffect(() => {
    const hasContextsChange = JSON.stringify(contexts) !== JSON.stringify(session.contexts || []);
    const hasInstructionsChange = JSON.stringify(instructions) !== JSON.stringify(session.instructions || []);
    const hasQuestionTypeChange = questionType !== (session.questionType || 'multipleChoice');
    const hasLatexChange = enableLatex !== (session.enableLatex || false);
    const hasCodeChange = enableCodeVisualization !== (session.enableCodeVisualization || false);
    const hasLearningChange = JSON.stringify(learningSettings) !== JSON.stringify(normalizeLearningSettings(session.learningSettings));
    const hasDifficultyChange = difficulty !== (session.difficulty ?? 'medium');
    setHasChanges(
      hasContextsChange ||
      hasInstructionsChange ||
      hasQuestionTypeChange ||
      hasLatexChange ||
      hasCodeChange ||
      hasLearningChange ||
      hasDifficultyChange
    );
  }, [contexts, instructions, questionType, enableLatex, enableCodeVisualization, learningSettings, difficulty, session]);

  // Focus moves into the dialog on open and back to the trigger on close; the page behind does not scroll.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [isOpen]);

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm(t.unsavedChangesConfirm)) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Esc closes (through the unsaved-changes check); Tab stays inside the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  if (!isOpen) return null;

  const addContext = () => {
    if (newContext.trim() && !contexts.includes(newContext.trim())) {
      setContexts([...contexts, newContext.trim()]);
      setNewContext('');
    }
  };

  const removeContext = (index: number) => {
    setContexts(contexts.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    if (newInstruction.trim() && !instructions.includes(newInstruction.trim())) {
      setInstructions([...instructions, newInstruction.trim()]);
      setNewInstruction('');
    }
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateLearningSettings = (setting: keyof LearningSettings) => {
    setLearningSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSave = () => {
    const updates: SessionEditUpdates = {};

    if (JSON.stringify(contexts) !== JSON.stringify(session.contexts || [])) {
      updates.contexts = contexts;
    }

    if (JSON.stringify(instructions) !== JSON.stringify(session.instructions || [])) {
      updates.instructions = instructions;
    }

    if (questionType !== (session.questionType || 'multipleChoice')) {
      updates.questionType = questionType;
    }

    if (enableLatex !== (session.enableLatex || false)) {
      updates.enableLatex = enableLatex;
    }

    if (enableCodeVisualization !== (session.enableCodeVisualization || false)) {
      updates.enableCodeVisualization = enableCodeVisualization;
    }

    if (JSON.stringify(learningSettings) !== JSON.stringify(normalizeLearningSettings(session.learningSettings))) {
      updates.learningSettings = learningSettings;
    }

    if (difficulty !== (session.difficulty ?? 'medium')) {
      updates.difficulty = difficulty;
    }

    onSave(updates);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language);
  };

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'multipleChoice', label: t.multipleChoice },
    { value: 'dissertative', label: t.dissertative },
    { value: 'mixed', label: t.mixed },
  ];

  const learningTechniques: { key: keyof LearningSettings; label: string; desc: string }[] = [
    { key: 'spacedRepetition', label: t.spacedRepetition, desc: t.spacedRepetitionDesc },
    { key: 'interleaving', label: t.interleaving, desc: t.interleavingDesc },
    { key: 'elaborativeInterrogation', label: t.elaborativeInterrogation, desc: t.elaborativeInterrogationDesc },
    { key: 'selfExplanation', label: t.selfExplanation, desc: t.selfExplanationDesc },
    { key: 'desirableDifficulties', label: t.desirableDifficulties, desc: t.desirableDifficultiesDesc },
  ];

  const hasHistory = Boolean(
    session.contextsHistory?.length || session.instructionHistory?.length || session.learningSettingsHistory?.length
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-session-title"
        tabIndex={-1}
        className="flex h-full w-full flex-col bg-surface outline-none overlay-shadow sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-md sm:border sm:border-line"
      >
        <div className="panel-head shrink-0 flex-nowrap py-2 pr-2 sm:pr-3">
          <div className="flex min-w-0 items-baseline gap-3">
            <h2 id="edit-session-title" className="text-lg font-bold leading-tight text-ink">
              {t.editSession}
            </h2>
            <span className="callno">{sessionCallNumber(contexts)}</span>
          </div>
          <button type="button" onClick={handleCancel} className="btn btn-ghost btn-icon shrink-0" aria-label={t.editClose}>
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-5">
          {/* Topics */}
          <section aria-labelledby="edit-topics-title">
            <h3 id="edit-topics-title" className="label">{t.editTopics}</h3>
            <div className="flex gap-2">
              <label htmlFor="edit-new-topic" className="sr-only">{t.editNewTopic}</label>
              <input
                id="edit-new-topic"
                type="text"
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addContext();
                  }
                }}
                placeholder={t.editContextPlaceholder}
                aria-invalid={contexts.length === 0}
                aria-describedby={contexts.length === 0 ? 'edit-topics-error' : undefined}
                className="field min-w-0 flex-1"
              />
              <button type="button" onClick={addContext} disabled={!newContext.trim()} className="btn btn-secondary">
                <Plus aria-hidden="true" />
                {t.add}
              </button>
            </div>
            {contexts.length > 0 ? (
              <ul className="mt-3 divide-y divide-line rounded-md border border-line" aria-label={formatMessage(contexts.length === 1 ? t.contextCountOne : t.contextCountOther, { count: contexts.length })}>
                {contexts.map((context, index) => (
                  <li key={index} className="flex items-center gap-3 py-0.5 pl-3 pr-0.5">
                    <span className="callno w-10 shrink-0">{topicCode(context)}</span>
                    <span className="min-w-0 flex-1 break-words text-[0.9375rem] text-ink">{context}</span>
                    <button
                      type="button"
                      onClick={() => removeContext(index)}
                      className="btn btn-ghost btn-icon shrink-0"
                      aria-label={formatMessage(t.editRemoveItem, { item: context })}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p id="edit-topics-error" className="field-error">{t.atLeastOneContextRequired}</p>
            )}
          </section>

          {/* Instructions */}
          <section aria-labelledby="edit-instructions-title">
            <h3 id="edit-instructions-title" className="label">
              {t.editInstructions} <span className="font-normal text-ink-muted">· {t.editOptional}</span>
            </h3>
            <div className="flex gap-2">
              <label htmlFor="edit-new-instruction" className="sr-only">{t.editNewInstruction}</label>
              <input
                id="edit-new-instruction"
                type="text"
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addInstruction();
                  }
                }}
                placeholder={t.editInstructionPlaceholder}
                className="field min-w-0 flex-1"
              />
              <button type="button" onClick={addInstruction} disabled={!newInstruction.trim()} className="btn btn-secondary">
                <Plus aria-hidden="true" />
                {t.add}
              </button>
            </div>
            {instructions.length > 0 && (
              <ul className="mt-3 divide-y divide-line rounded-md border border-line" aria-label={formatMessage(instructions.length === 1 ? t.instructionCountOne : t.instructionCountOther, { count: instructions.length })}>
                {instructions.map((instruction, index) => (
                  <li key={index} className="flex items-center justify-between gap-3 py-0.5 pl-3 pr-0.5 text-[0.9375rem] text-ink">
                    <span className="min-w-0 break-words">{instruction}</span>
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="btn btn-ghost btn-icon shrink-0"
                      aria-label={formatMessage(t.editRemoveItem, { item: instruction })}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Question type */}
          <section aria-labelledby="edit-question-type-title">
            <h3 id="edit-question-type-title" className="label">{t.questionType}</h3>
            <div role="radiogroup" aria-labelledby="edit-question-type-title" className="segmented flex w-full">
              {questionTypes.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={questionType === value}
                  onClick={() => setQuestionType(value)}
                  className="flex-1 px-2"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Difficulty */}
          <section aria-labelledby="edit-difficulty-title">
            <h3 id="edit-difficulty-title" className="label">{t.difficulty}</h3>
            <div role="radiogroup" aria-labelledby="edit-difficulty-title" className="segmented flex w-full">
              {DIFFICULTIES.map(level => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === level}
                  onClick={() => setDifficulty(level)}
                  className="flex-1"
                >
                  {levelLabels[level]}
                </button>
              ))}
            </div>
          </section>

          {/* Learning techniques */}
          <section aria-labelledby="edit-learning-title">
            <h3 id="edit-learning-title" className="label">{t.learningTechniques}</h3>
            <div className="choice-group">
              {learningTechniques.map(({ key, label, desc }) => (
                <label key={key} className="choice">
                  <input
                    type="checkbox"
                    checked={learningSettings[key]}
                    onChange={() => updateLearningSettings(key)}
                    className="mt-1 h-4 w-4 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{label}</span>
                    <span className="mt-0.5 block text-sm text-ink-soft">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Display */}
          <section aria-labelledby="edit-display-title">
            <h3 id="edit-display-title" className="label">{t.editDisplay}</h3>
            <div className="choice-group">
              <label className="choice">
                <input
                  type="checkbox"
                  checked={enableLatex}
                  onChange={(e) => setEnableLatex(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{t.enableLatex}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{t.enableLatexDesc}</span>
                </span>
              </label>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={enableCodeVisualization}
                  onChange={(e) => setEnableCodeVisualization(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{t.enableCodeVisualization}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{t.enableCodeVisualizationDesc}</span>
                </span>
              </label>
            </div>
          </section>

          {/* Change history */}
          <section aria-labelledby="edit-history-title" className="border-t border-line pt-6">
            <h3 id="edit-history-title" className="label">{t.editTabHistoryDesc}</h3>
            {!hasHistory && <p className="text-sm text-ink-muted">{t.noChangesYetDesc}</p>}

            {session.contextsHistory && session.contextsHistory.length > 0 && (
              <div className="mt-3">
                <h4 className="caps-label">{t.contextsHistory}</h4>
                <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
                  {session.contextsHistory.map(entry => (
                    <li key={entry.id} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <span className="text-ink-muted tabular">{formatDate(entry.changedAt)}</span>
                      <span className="min-w-0 break-words text-ink">
                        <span className="text-ink-muted">{t.previousLabel}</span> {entry.previousContexts.join(', ')}
                        <br />
                        <span className="text-ink-muted">{t.newLabel}</span> {entry.newContexts.join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {session.instructionHistory && session.instructionHistory.length > 0 && (
              <div className="mt-5">
                <h4 className="caps-label">{t.instructionsHistory}</h4>
                <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
                  {session.instructionHistory.map(entry => (
                    <li key={entry.id} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <span className="text-ink-muted tabular">{formatDate(entry.changedAt)}</span>
                      <span className="min-w-0 break-words text-ink">
                        <span className="tag mr-2">{entry.action === 'added' ? t.added : t.removed}</span>
                        {entry.instruction}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {session.learningSettingsHistory && session.learningSettingsHistory.length > 0 && (
              <div className="mt-5">
                <h4 className="caps-label">{t.learningTechniquesHistory}</h4>
                <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
                  {session.learningSettingsHistory.map(entry => (
                    <li key={entry.id} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <span className="text-ink-muted tabular">{formatDate(entry.changedAt)}</span>
                      <span className="text-ink">{t.learningTechniquesUpdated}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-line px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
          {hasChanges && <p className="mr-auto text-sm text-ink-muted" aria-live="polite">{t.unsavedChanges}</p>}
          <button type="button" onClick={handleCancel} className="btn btn-secondary">
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || contexts.length === 0}
            className="btn btn-primary"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
