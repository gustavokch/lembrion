import { ArrowLeft, Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { STORAGE_KEYS } from '../core/config/constants';
import { formatDate, formatMessage } from '../core/services';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Difficulty, Question, StudySession } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { stripExplanationLabel } from './explanationText';
import { answeredCount, difficultyLabels, isAnswered, sessionScore } from './pages/StudyPage/learningTechniques';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function SessionDetails() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const levelLabels = difficultyLabels(t);
  const [sessions] = useLocalStorage<StudySession[]>(STORAGE_KEYS.SESSIONS, []);

  const session = sessions.find(s => s.id === id);

  const backLink = (
    <Link to="/history" className="inline-flex min-h-10 items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {t.history}
    </Link>
  );

  if (!session) {
    return (
      <div className="page [&>*]:max-w-4xl">
        {backLink}
        <h1 className="page-title mt-4">{t.sessionNotFound}</h1>
        <p className="page-lede">{t.sessionNotFoundDesc}</p>
        <Link to="/history" className="btn btn-secondary mt-6">
          {t.backToHistory}
        </Link>
      </div>
    );
  }

  const answeredQuestions = answeredCount(session.questions);
  const correctQuestions = session.questions.filter(q => q.isCorrect === true).length;
  const score = sessionScore(session.questions);

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

  return (
    <div className="page [&>*]:max-w-4xl">
      {backLink}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title break-words">{session.contexts.join(' · ')}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
            <span className="tabular">{meta.join(' · ')}</span>
            {session.status === 'active' ? (
              <span className="tag tag-accent">{t.historyStatusActive}</span>
            ) : (
              <span className="tag">{t.completed}</span>
            )}
            {session.kind === 'review' && <span className="tag">{t.reviewSessionLabel}</span>}
          </div>
          {session.instructions && session.instructions.length > 0 && (
            <p className="mt-2 max-w-measure text-sm text-ink-soft">
              <span className="font-medium text-ink">{t.instructionsLabel}</span> {session.instructions.join(' · ')}
            </p>
          )}
        </div>
        {session.status === 'active' && (
          <Link to="/study" state={{ sessionId: session.id }} className="btn btn-primary">
            {t.continueSession}
          </Link>
        )}
      </div>

      <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="facts border-b border-line pb-2">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="section-title mt-10">{t.questionsAndAnswers}</h2>
      <ol>
        {session.questions.map((question, index) => (
          <li key={question.id} className={`py-8 ${index > 0 ? 'border-t border-line' : ''}`}>
            <QuestionReview question={question} number={index + 1} levelLabels={levelLabels} />
          </li>
        ))}
      </ol>
    </div>
  );
}

interface QuestionReviewProps {
  question: Question;
  number: number;
  levelLabels: Record<Difficulty, string>;
}

function QuestionReview({ question, number, levelLabels }: QuestionReviewProps) {
  const { t } = useLanguage();
  const answered = isAnswered(question);

  return (
    <article aria-labelledby={`question-${question.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={`question-${question.id}`} className="mr-1 font-medium text-ink">
          {t.question} {number}
        </h3>
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

      <div className="mt-3 max-w-measure break-words text-ink">
        <MarkdownRenderer content={question.question} />
      </div>

      <div className="mt-5 space-y-4">
        {question.type === 'multipleChoice' && question.options ? (
          <>
            <div className="max-w-measure">
              {question.options.map((option, optionIndex) => {
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
                          ? `${t.detailsYourAnswer} · ${t.correct}`
                          : isCorrectOption
                            ? t.correct
                            : t.detailsYourAnswer}
                      </span>
                    ) : (
                      <span />
                    )}
                  </div>
                );
              })}
            </div>
            {question.explanation && (
              <ReviewBlock title={t.detailsExplanation}>
                <MarkdownRenderer content={stripExplanationLabel(question.explanation)} />
              </ReviewBlock>
            )}
          </>
        ) : (
          <>
            <ReviewBlock title={t.detailsYourAnswer}>
              <MarkdownRenderer content={question.userAnswer?.toString() || t.noAnswerProvided} />
            </ReviewBlock>
            {question.feedback && (
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
            {question.correctAnswerText && (
              <ReviewBlock title={t.detailsModelAnswer}>
                <MarkdownRenderer content={question.correctAnswerText} />
              </ReviewBlock>
            )}
          </>
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
                <p className="text-sm font-medium text-ink">{t.detailsYourAnswer}</p>
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
    <section className={`block max-w-measure ${variant ? `block-${variant}` : ''}`}>
      <h4 className="block-title">{title}</h4>
      <div className="block-body break-words">{children}</div>
    </section>
  );
}
