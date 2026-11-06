import { AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PATREON_URL, STORAGE_KEYS } from '../../core/config/constants';
import { validateProviderConfig } from '../../core/services/ai/providers/registry';
import { formatDate, formatMessage } from '../../core/services/i18n';
import { Language } from '../../core/types';
import { createId } from '../../core/utils/id';
import { useLanguage, useLocalStorage, useMultiProviderSettings } from '../../hooks';
import { StudySession } from '../../types';
import { answeredCount, isAnswered, sessionScore } from './StudyPage/learningTechniques';
import {
  createReviewSession,
  dueReviews,
  findOpenReviewSession,
  nextDueDate,
  RETIRED_BOX,
  REVIEW_INTERVAL_DAYS,
} from './StudyPage/reviewSchedule';

const DAY_MS = 24 * 60 * 60 * 1000;
const AXIS_DAYS = REVIEW_INTERVAL_DAYS[REVIEW_INTERVAL_DAYS.length - 1];
const AXIS_TICKS = [0, 7, 14, AXIS_DAYS];

interface ProgressSummary {
  sessions: number;
  answered: number;
  /** Correct / answered as a whole percentage; undefined when nothing was answered. */
  accuracy?: number;
}

function summarize(sessions: StudySession[]): ProgressSummary {
  let answered = 0;
  let correct = 0;
  for (const session of sessions) {
    for (const question of session.questions) {
      if (!isAnswered(question)) continue;
      answered++;
      if (question.isCorrect) correct++;
    }
  }
  return {
    sessions: sessions.length,
    answered,
    accuracy: answered > 0 ? Math.round((correct / answered) * 100) : undefined,
  };
}

interface BoxSummary {
  /** Scheduled originals per box; index 0 is box 1. */
  counts: number[];
  /** Questions due at `now` per box. */
  due: number[];
  retired: number;
}

function summarizeBoxes(sessions: StudySession[], now: Date): BoxSummary {
  const counts = REVIEW_INTERVAL_DAYS.map(() => 0);
  const due = REVIEW_INTERVAL_DAYS.map(() => 0);
  let retired = 0;
  for (const session of sessions) {
    for (const question of session.questions) {
      if (question.reviewOf !== undefined || question.reviewBox === undefined) continue;
      if (question.reviewBox === RETIRED_BOX) {
        retired++;
        continue;
      }
      const index = question.reviewBox - 1;
      if (index < 0 || index >= counts.length) continue;
      counts[index]++;
      if (question.nextReview && Date.parse(question.nextReview) <= now.getTime()) due[index]++;
    }
  }
  return { counts, due, retired };
}

function shortDate(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const [sessions, setSessions] = useLocalStorage<StudySession[]>(STORAGE_KEYS.SESSIONS, []);
  const [providerSettings] = useMultiProviderSettings();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const now = new Date();
  const providerReady = validateProviderConfig(
    providerSettings.currentProvider,
    providerSettings.providers[providerSettings.currentProvider],
    language
  ).valid;

  const totalSessions = sessions.length;
  const weekStart = now.getTime() - 7 * DAY_MS;
  const allTime = summarize(sessions);
  const lastWeek = summarize(sessions.filter((s) => Date.parse(s.createdAt) >= weekStart));

  // Review queue: with nothing due, the next due date shows instead
  const dueReviewCount = dueReviews(sessions, now, Infinity).length;
  const nextReviewDate = nextDueDate(sessions);
  const openReview = findOpenReviewSession(sessions, now);
  const boxes = summarizeBoxes(sessions, now);

  // Newest first by start time; review sessions are resumed through the review action
  const newestFirst = [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const activeSessions = newestFirst.filter((s) => s.status === 'active' && s.kind !== 'review').slice(0, 3);
  const recentSessions = newestFirst.slice(0, 5);
  const newSessionIsNext = dueReviewCount === 0 && activeSessions.length === 0;

  // An unfinished review session is resumed; otherwise a new one is stored and StudyPage resumes it
  const startReview = () => {
    const now = new Date();
    const openReview = findOpenReviewSession(sessions, now);
    if (openReview) {
      navigate('/study', { state: { sessionId: openReview.id } });
      return;
    }
    const reviewSession = createReviewSession(sessions, now, createId);
    if (!reviewSession) return;
    setSessions((prev) => [...prev, reviewSession]);
    navigate('/study', { state: { sessionId: reviewSession.id } });
  };

  const formatPercent = (value: number | undefined) => (value === undefined ? '—' : `${value}%`);
  const sessionScoreText = (session: StudySession) =>
    answeredCount(session.questions) > 0 ? `${sessionScore(session.questions)}%` : '—';
  const questionCountText = (count: number) =>
    formatMessage(count === 1 ? t.questionCountOne : t.questionCountOther, { count });
  const boxLabel = (index: number) =>
    formatMessage(t.dashboardBoxLabel, { box: index + 1, days: REVIEW_INTERVAL_DAYS[index] });
  const sessionTypeLabel = (session: StudySession) => {
    if (session.questionType === 'dissertative') return t.dissertative;
    if (session.questionType === 'mixed') return t.mixed;
    return t.multipleChoice;
  };

  const typeCell = (session: StudySession) =>
    session.kind === 'review' ? <span className="tag">{t.reviewSessionLabel}</span> : sessionTypeLabel(session);
  const statusTag = (session: StudySession) =>
    session.status === 'active' ? (
      <span className="tag tag-accent">{t.inProgress}</span>
    ) : (
      <span className="tag">{t.completed}</span>
    );

  const progressRows: [string, ProgressSummary][] = [
    [t.dashboardLast7Days, lastWeek],
    [t.dashboardAllTime, allTime],
  ];

  return (
    <div>
      {/* Overview band: the title bar's ground carried down, with progress, boxes and the next action */}
      <section aria-labelledby="dashboard-heading" className="band border-t border-[color:var(--band-rule)]">
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-10">
          <h1 id="dashboard-heading" className="sr-only">
            {t.dashboard}
          </h1>

          {!providerReady && (
            <div className="notice notice-warning mb-8">
              <AlertTriangle aria-hidden="true" />
              <p>
                {t.dashboardProviderNotReady}{' '}
                <Link to="/settings" className="font-medium underline">
                  {t.dashboardOpenSettings}
                </Link>
              </p>
            </div>
          )}

          {totalSessions === 0 ? (
            <div className="max-w-measure py-2">
              <p className="statement">{t.noSessionsYetDesc}</p>
              <Link to="/study" className="btn btn-inverse mt-6">
                {t.startFirstSession}
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr] lg:gap-x-12">
              <section aria-labelledby="progress-heading" className="min-w-0">
                <h2 id="progress-heading" className="section-title">
                  {t.dashboardProgress}
                </h2>
                <table className="data-table mt-1">
                  <thead>
                    <tr>
                      <th scope="col">
                        <span className="sr-only">{t.dashboardPeriod}</span>
                      </th>
                      <th scope="col" className="num">
                        {t.dashboardSessions}
                      </th>
                      <th scope="col" className="num">
                        {t.questionsAnswered}
                      </th>
                      <th scope="col" className="num">
                        {t.dashboardAccuracy}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressRows.map(([label, summary]) => (
                      <tr key={label}>
                        <th scope="row" className="whitespace-nowrap align-baseline">
                          {label}
                        </th>
                        <td className="num">
                          <span className="figure">{summary.sessions}</span>
                        </td>
                        <td className="num">
                          <span className="figure">{summary.answered}</span>
                        </td>
                        <td className="num">
                          <span className="figure">{formatPercent(summary.accuracy)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Second in the DOM so phones reach the next action before the box chart */}
              <section aria-labelledby="next-heading" className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                <h2 id="next-heading" className="section-title">
                  {t.dashboardNext}
                </h2>
                <ul className="band-rows">
                  {dueReviewCount > 0 ? (
                    <li className="pb-5 pt-4">
                      <p className="statement tabular">
                        {formatMessage(dueReviewCount === 1 ? t.reviewDueCountOne : t.reviewDueCountOther, {
                          count: dueReviewCount,
                        })}
                      </p>
                      <button type="button" onClick={startReview} className="btn btn-inverse mt-4">
                        {openReview ? t.dashboardResumeReview : t.startReview}
                      </button>
                    </li>
                  ) : (
                    nextReviewDate && (
                      <li className="py-4 text-sm text-shell-muted">
                        {formatMessage(t.reviewNextDue, { date: formatDate(nextReviewDate, language) })}
                      </li>
                    )
                  )}
                  {activeSessions.map((session) => {
                    const topics = session.contexts.join(' · ');
                    return (
                      <li key={session.id} className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium" title={topics}>
                            {topics}
                          </p>
                          <p className="text-sm text-shell-muted tabular">
                            {questionCountText(answeredCount(session.questions))}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('/study', { state: { sessionId: session.id } })}
                          aria-label={formatMessage(t.dashboardResumeAria, { topics })}
                          className="btn btn-outline-inverse btn-sm min-h-10"
                        >
                          {t.dashboardResume}
                        </button>
                      </li>
                    );
                  })}
                  <li className="py-4">
                    <Link to="/study" className={`btn ${newSessionIsNext ? 'btn-inverse' : 'btn-outline-inverse'}`}>
                      {t.newSession}
                    </Link>
                  </li>
                </ul>
                {PATREON_URL && (
                  <p className="mt-2 text-sm text-shell-muted">
                    {t.dashboardSupportLine}{' '}
                    <a
                      href={PATREON_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-shell-ink underline"
                    >
                      {t.supportOnPatreon}
                    </a>
                  </p>
                )}
              </section>

              <section aria-labelledby="boxes-heading" className="min-w-0 lg:col-start-1 lg:row-start-2">
                <h2 id="boxes-heading" className="section-title">
                  {t.dashboardReviewBoxes}
                </h2>
                <figure className="mt-4">
                  {/* Every box drawn on one linear 0-30 day axis, at its true interval */}
                  <div
                    aria-hidden="true"
                    className="grid grid-cols-[max-content_minmax(0,1fr)_max-content_3ch] items-center gap-x-4 gap-y-3 text-sm"
                  >
                    {boxes.counts.map((count, index) => {
                      const from = index === 0 ? 0 : REVIEW_INTERVAL_DAYS[index - 1];
                      const to = REVIEW_INTERVAL_DAYS[index];
                      const state = boxes.due[index] > 0 ? 'due' : count > 0 ? 'scheduled' : 'empty';
                      return (
                        <div key={to} className="contents">
                          <span className="whitespace-nowrap text-shell-muted tabular">{boxLabel(index)}</span>
                          <div className="box-track">
                            <span
                              className="box-fill"
                              data-state={state}
                              style={{
                                left: `${(from / AXIS_DAYS) * 100}%`,
                                width: `${((to - from) / AXIS_DAYS) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-band-accent whitespace-nowrap text-right text-xs font-medium tabular">
                            {boxes.due[index] > 0 ? formatMessage(t.dashboardBoxDue, { count: boxes.due[index] }) : ''}
                          </span>
                          <span className="text-right font-medium tabular">{count}</span>
                        </div>
                      );
                    })}
                    <span />
                    <div className="relative h-4 text-xs text-shell-muted tabular">
                      {AXIS_TICKS.map((day) => (
                        <span
                          key={day}
                          className={`absolute top-0 whitespace-nowrap ${
                            day === 0 ? '' : day === AXIS_DAYS ? '-translate-x-full' : '-translate-x-1/2'
                          }`}
                          style={{ left: `${(day / AXIS_DAYS) * 100}%` }}
                        >
                          {formatMessage(t.dashboardDays, { days: day })}
                        </span>
                      ))}
                    </div>
                    <span />
                    <span />
                  </div>
                  <table className="sr-only">
                    <caption>{t.dashboardReviewBoxes}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t.dashboardBox}</th>
                        <th scope="col">{t.dashboardScheduledQuestions}</th>
                        <th scope="col">{t.dashboardDueNow}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boxes.counts.map((count, index) => (
                        <tr key={REVIEW_INTERVAL_DAYS[index]}>
                          <th scope="row">{boxLabel(index)}</th>
                          <td>{count}</td>
                          <td>{boxes.due[index]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <figcaption className="mt-4 text-sm text-shell-muted tabular">
                    {formatMessage(t.dashboardBoxSummary, { due: dueReviewCount, retired: boxes.retired })}
                  </figcaption>
                </figure>
              </section>
            </div>
          )}
        </div>
      </section>

      <div className="page">
        {totalSessions > 0 && (
          <section aria-labelledby="recent-heading">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-1.5">
              <h2 id="recent-heading" className="text-[0.9375rem] font-semibold text-ink">
                {t.recentSessions}
              </h2>
              <Link to="/history" className="text-sm text-ink-soft underline hover:text-ink">
                {t.dashboardAllSessions}
              </Link>
            </div>

            <table className="data-table mt-2 hidden md:table">
              <thead>
                <tr>
                  <th scope="col">{t.dashboardTopics}</th>
                  <th scope="col">{t.dashboardType}</th>
                  <th scope="col" className="num">
                    {t.questions}
                  </th>
                  <th scope="col" className="num">
                    {t.score}
                  </th>
                  <th scope="col" className="num">
                    {t.date}
                  </th>
                  <th scope="col">{t.dashboardStatus}</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="max-w-[26rem]">
                      <Link
                        to={`/session/${session.id}`}
                        title={session.contexts.join(' · ')}
                        className="block truncate font-medium text-ink underline decoration-line-strong hover:decoration-ink"
                      >
                        {session.contexts.join(' · ')}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-ink-soft">{typeCell(session)}</td>
                    <td className="num">{answeredCount(session.questions)}</td>
                    <td className="num">{sessionScoreText(session)}</td>
                    <td className="num whitespace-nowrap">{shortDate(session.createdAt, language)}</td>
                    <td>{statusTag(session)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-line border-b border-line md:hidden">
              {recentSessions.map((session) => (
                <li key={session.id} className="py-2">
                  <Link
                    to={`/session/${session.id}`}
                    className="block truncate py-2 font-medium text-ink underline decoration-line-strong"
                  >
                    {session.contexts.join(' · ')}
                  </Link>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-2 text-sm text-ink-soft tabular">
                    <span>{typeCell(session)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{questionCountText(answeredCount(session.questions))}</span>
                    <span aria-hidden="true">·</span>
                    <span>{sessionScoreText(session)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{shortDate(session.createdAt, language)}</span>
                    {statusTag(session)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className={`${totalSessions > 0 ? 'mt-10 ' : ''}max-w-measure text-sm text-ink-muted`}>
          {t.dataTipDesc}{' '}
          <Link to="/settings" className="text-ink-soft underline hover:text-ink">
            {t.dashboardOpenSettings}
          </Link>
        </p>
      </div>
    </div>
  );
}
