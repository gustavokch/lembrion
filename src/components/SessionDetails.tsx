import { ArrowLeft, Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { STORAGE_KEYS } from '../core/config/constants';
import { formatDate, formatMessage } from '../core/services';
import type { Language, Translations } from '../core/types';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Difficulty, Question, StudySession } from '../types';
import { callNumber, sessionCallNumber } from './callNumber';
import MarkdownRenderer from './MarkdownRenderer';
import { stripExplanationLabel } from './explanationText';
import { answeredCount, difficultyLabels, isAnswered, sessionScore } from './pages/StudyPage/learningTechniques';
import { RETIRED_BOX } from './pages/StudyPage/reviewSchedule';
import { stampDate, stampDateTime } from './stampDate';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface ReviewStamp {
  className: string;
  label: string;
}

/** The Leitner box while a question is scheduled for review (1-5 with a due time). */
function scheduledBox(question: Question): number | undefined {
  const box = question.reviewBox;
  return box !== undefined && box >= 1 && box < RETIRED_BOX && question.nextReview ? box : undefined;
}

/**
 * A question's mark: "Returned" once answered without entering the review queue, red when
 * due before today, violet when due now, faded while not yet due (with the time when that is
 * later today), neutral "Retired" once it left the queue. Unanswered questions and review
 * copies carry none.
 */
function reviewStamp(question: Question, now: Date, t: Translations, language: Language): ReviewStamp | undefined {
  if (question.reviewOf !== undefined) return undefined;
  if (question.reviewBox === undefined) {
    return isAnswered(question) ? { className: 'stamp stamp-quiet', label: t.detailsStampReturned } : undefined;
  }
  if (question.reviewBox === RETIRED_BOX) return { className: 'stamp stamp-quiet', label: t.detailsStampRetired };
  if (scheduledBox(question) === undefined) return undefined;
  const due = new Date(question.nextReview!);
  if (Number.isNaN(due.getTime())) return undefined;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (due < startOfToday) {
    const date = stampDate(due, language, due.getFullYear() !== now.getFullYear());
    return { className: 'stamp stamp-overdue', label: formatMessage(t.detailsStampOverdue, { date }) };
  }
  if (due <= now) return { className: 'stamp', label: formatMessage(t.detailsStampDue, { date: stampDate(due, language) }) };
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const date = due < startOfTomorrow ? stampDateTime(due, language) : stampDate(due, language);
  return { className: 'stamp stamp-later', label: formatMessage(t.detailsStampDue, { date }) };
}

export default function SessionDetails() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const levelLabels = difficultyLabels(t);
  const [sessions] = useLocalStorage<StudySession[]>(STORAGE_KEYS.SESSIONS, []);

  const session = sessions.find(s => s.id === id);

  const backLink = (
    <Link to="/history" className="-ml-1 inline-flex min-h-10 items-center gap-1.5 px-1 text-sm font-medium text-ink-soft hover:text-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t.history}
    </Link>
  );

  if (!session) {
    return (
      <div className="page">
        {backLink}
        <header className="mt-2">
          <h1 className="page-title">{t.sessionNotFound}</h1>
          <p className="page-lede mt-1">{t.sessionNotFoundDesc}</p>
        </header>
        <Link to="/history" className="btn btn-secondary mt-6">
          {t.backToHistory}
        </Link>
      </div>
    );
  }

  const answeredQuestions = answeredCount(session.questions);
  const correctQuestions = session.questions.filter(q => q.isCorrect === true).length;
  const score = sessionScore(session.questions);
  const now = new Date();

  const sessionType =
    session.questionType === 'dissertative'
      ? t.dissertative
      : session.questionType === 'mixed'
        ? t.mixed
        : session.questionType === 'multipleChoice'
          ? t.multipleChoice
          : null;

  const meta = [
    formatDate(session.createdAt, language),
    sessionType,
    levelLabels[session.difficulty ?? 'medium'],
  ].filter((item): item is string => Boolean(item));

  const facts: [string, string | number][] = [
    [t.questions, session.questions.length],
    [t.detailsAnswered, answeredQuestions],
    [t.correct, correctQuestions],
    [t.score, answeredQuestions > 0 ? `${score}%` : '—'],
  ];

  // A question's topic: its interleaving focus, else the first topic of the session that holds the original.
  const topicOf = (question: Question) => {
    if (question.context) return question.context;
    const source = question.sourceSessionId ? sessions.find(s => s.id === question.sourceSessionId) : undefined;
    return (source ?? session).contexts[0] ?? '';
  };

  return (
    <div className="page">
      {backLink}

      <header className="page-header mt-2 items-start">
        <div className="min-w-0 max-w-4xl">
          <h1 className="page-title break-words">{session.contexts.join(' · ')}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="callno">{sessionCallNumber(session.contexts)}</span>
            <span className="page-lede tabular">{meta.join(' · ')}</span>
            {session.status === 'active' ? (
              <span className="tag tag-accent">{t.historyStatusActive}</span>
            ) : (
              <span className="tag">{t.sessionStatusCompleted}</span>
            )}
            {session.kind === 'review' && <span className="tag">{t.reviewSessionLabel}</span>}
          </div>
          {session.instructions && session.instructions.length > 0 && (
            <p className="mt-2 max-w-measure text-sm text-ink-soft">
              <span className="font-semibold text-ink">{t.instructionsLabel}</span> {session.instructions.join(' · ')}
            </p>
          )}
          <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {facts.map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2">
                <dt className="caps-label">{label}</dt>
                <dd className="figure text-[1.375rem]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {session.status === 'active' && (
          <Link to="/study" state={{ sessionId: session.id }} className="btn btn-primary">
            {t.continueSession}
          </Link>
        )}
      </header>

      <h2 className="section-title mt-8">{t.questionsAndAnswers}</h2>
      <ol className="mt-4 space-y-4">
        {session.questions.map((question, index) => (
          <li key={question.id}>
            <QuestionReview
              question={question}
              number={index + 1}
              callNo={callNumber(topicOf(question), scheduledBox(question))}
              stamp={reviewStamp(question, now, t, language)}
              levelLabels={levelLabels}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

interface QuestionReviewProps {
  question: Question;
  number: number;
  callNo: string;
  stamp?: ReviewStamp;
  levelLabels: Record<Difficulty, string>;
}

function QuestionReview({ question, number, callNo, stamp, levelLabels }: QuestionReviewProps) {
  const { t } = useLanguage();
  const answered = isAnswered(question);
  const options = question.type === 'multipleChoice' ? question.options : undefined;
  const hasAside = Boolean(
    (options ? question.explanation : question.feedback || question.correctAnswerText) ||
      question.aiEvaluation ||
      question.elaborativeQuestion ||
      question.selfExplanation ||
      question.selfExplanationFeedback
  );

  return (
    <article aria-labelledby={`question-${question.id}`} className="panel">
      <header className="panel-head">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <h3 id={`question-${question.id}`} className="panel-title mr-1">
            {t.question} {number}
          </h3>
          <span className="callno mr-1">{callNo}</span>
          {answered ? (
            question.isCorrect ? (
              <span className="tag tag-success">{t.correct}</span>
            ) : (
              <span className="tag tag-error">{t.detailsIncorrect}</span>
            )
          ) : (
            <span className="tag">{t.detailsNotAnswered}</span>
          )}
          <span className="tag">{question.type === 'multipleChoice' ? t.multipleChoice : t.dissertative}</span>
          {question.reviewOf && <span className="tag">{t.reviewQuestion}</span>}
          {question.difficulty && <span className="tag">{levelLabels[question.difficulty]}</span>}
          {answered && question.confidence !== undefined && (
            <span className="tag tabular">{formatMessage(t.detailsConfidence, { value: question.confidence })}</span>
          )}
          <span className="text-sm text-ink-muted tabular">
            {question.attempts} {question.attempts !== 1 ? t.attempts : t.attempt}
          </span>
        </div>
        {stamp && <span className={stamp.className}>{stamp.label}</span>}
      </header>

      <div className={`panel-body ${hasAside ? 'lg:grid lg:grid-cols-2 lg:gap-x-8' : ''}`}>
        <div className={hasAside ? 'max-w-measure lg:max-w-none' : 'max-w-measure'}>
          <div className="break-words text-ink">
            <MarkdownRenderer content={question.question} />
          </div>

          <div className="mt-4">
            {options ? (
              options.map((option, optionIndex) => {
                const isCorrectOption = optionIndex === question.correctAnswer;
                const isUserAnswer = optionIndex === question.userAnswer;
                const state = isCorrectOption ? 'correct' : isUserAnswer ? 'wrong' : 'muted';
                return (
                  <div key={optionIndex} className="option" data-state={state}>
                    <span className="option-key">{OPTION_KEYS[optionIndex] ?? optionIndex + 1}</span>
                    <div className="min-w-0 break-words">
                      <MarkdownRenderer content={option} />
                    </div>
                    {(isCorrectOption || isUserAnswer) ? (
                      <span className="option-note">
                        {isCorrectOption ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
                        {isCorrectOption && isUserAnswer
                          ? t.studyYourAnswerCorrectNote
                          : isCorrectOption
                            ? t.studyCorrectAnswerNote
                            : t.studyYourAnswerNote}
                      </span>
                    ) : (
                      <span />
                    )}
                  </div>
                );
              })
            ) : (
              <ReviewBlock title={t.detailsYourAnswer}>
                <MarkdownRenderer content={question.userAnswer?.toString() || t.noAnswerProvided} />
              </ReviewBlock>
            )}
          </div>
        </div>

        {hasAside && (
          <div className="mt-4 max-w-measure space-y-4 lg:mt-0 lg:max-w-none">
            {options && question.explanation && (
              <ReviewBlock title={t.detailsExplanation}>
                <MarkdownRenderer content={stripExplanationLabel(question.explanation)} />
              </ReviewBlock>
            )}

            {!options && question.feedback && (
              <ReviewBlock
                title={
                  question.score !== undefined
                    ? formatMessage(t.detailsFeedbackScore, { score: question.score })
                    : t.detailsFeedback
                }
                variant={answered ? (question.isCorrect ? 'success' : 'error') : undefined}
              >
                <MarkdownRenderer content={question.feedback} />
              </ReviewBlock>
            )}

            {!options && question.correctAnswerText && (
              <ReviewBlock title={t.detailsModelAnswer}>
                <MarkdownRenderer content={question.correctAnswerText} />
              </ReviewBlock>
            )}

            {question.aiEvaluation && (
              <ReviewBlock title={t.detailsEvaluation}>
                <MarkdownRenderer content={question.aiEvaluation} />
              </ReviewBlock>
            )}

            {question.elaborativeQuestion && (
              <ReviewBlock title={t.elaborativeInterrogation}>
                <MarkdownRenderer content={question.elaborativeQuestion} />
                {question.elaborativeAnswer && (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="text-sm font-semibold text-ink">{t.detailsYourAnswer}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words">{question.elaborativeAnswer}</p>
                  </div>
                )}
              </ReviewBlock>
            )}

            {question.selfExplanation && (
              <ReviewBlock title={t.selfExplanation}>
                <p className="whitespace-pre-wrap break-words">{question.selfExplanation}</p>
              </ReviewBlock>
            )}

            {question.selfExplanationFeedback && (
              <ReviewBlock title={t.explanationFeedbackTitle}>
                <MarkdownRenderer content={question.selfExplanationFeedback} />
              </ReviewBlock>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

interface ReviewBlockProps {
  title: string;
  variant?: 'success' | 'error';
  children: ReactNode;
}

function ReviewBlock({ title, variant, children }: ReviewBlockProps) {
  return (
    <section className={`note ${variant ? `note-${variant}` : ''}`}>
      <h4 className="note-title">{title}</h4>
      <div className="note-body break-words">{children}</div>
    </section>
  );
}
