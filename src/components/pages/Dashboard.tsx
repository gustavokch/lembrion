import { AlertTriangle, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PATREON_URL, STORAGE_KEYS } from '../../core/config/constants';
import { validateProviderConfig } from '../../core/services/ai/providers/registry';
import { formatMessage } from '../../core/services/i18n';
import { Language } from '../../core/types';
import { createId } from '../../core/utils/id';
import { useLanguage, useLocalStorage, useMultiProviderSettings } from '../../hooks';
import { StudySession } from '../../types';
import { callNumber, sessionCallNumber } from '../callNumber';
import { stampDate, stampDateTime } from '../stampDate';
import ExtentBar from '../ui/ExtentBar';
import { answeredCount, isAnswered, mostAnswered, sessionScore } from './StudyPage/learningTechniques';
import {
  createReviewSession,
  findOpenReviewSession,
  RETIRED_BOX,
  REVIEW_INTERVAL_DAYS,
  ScheduledReview,
  scheduledReviews,
} from './StudyPage/reviewSchedule';

const DAY_MS = 24 * 60 * 60 * 1000;
const AXIS_DAYS = REVIEW_INTERVAL_DAYS[REVIEW_INTERVAL_DAYS.length - 1];
const AXIS_TICKS = [0, 7, 14, AXIS_DAYS];

/** Due questions the slip lists before it folds the rest into one line. */
const SLIP_DUE_ROWS = 8;
/** Questions not yet due listed under the due ones; more when nothing is due. */
const SLIP_LATER_ROWS = 2;
const SLIP_LATER_ROWS_IDLE = 5;
const UNFINISHED_SESSIONS = 3;
const RECENT_SESSIONS = 5;

/** Hairline between slip rows in the phone list, as `table.slip` draws it. */
const SLIP_ROW_LINE = 'border-[color:color-mix(in_srgb,var(--color-errorInk)_20%,var(--color-line))]';

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
  /** Scheduled originals in the box. */
  count: number;
  /** Due before today began. */
  overdue: number;
  /** Due since today began, up to now. */
  dueToday: number;
}

/** Boxes 1-5 (index 0 is box 1) and the number of retired questions. */
function summarizeBoxes(
  sessions: StudySession[],
  nowTime: number,
  startOfToday: number
): { boxes: BoxSummary[]; retired: number } {
  const boxes = REVIEW_INTERVAL_DAYS.map(() => ({ count: 0, overdue: 0, dueToday: 0 }));
  let retired = 0;
  for (const session of sessions) {
    for (const question of session.questions) {
      if (question.reviewOf !== undefined || question.reviewBox === undefined) continue;
      if (question.reviewBox === RETIRED_BOX) {
        retired++;
        continue;
      }
      const box = boxes[question.reviewBox - 1];
      if (!box) continue;
      box.count++;
      const due = question.nextReview ? Date.parse(question.nextReview) : NaN;
      if (due < startOfToday) box.overdue++;
      else if (due <= nowTime) box.dueToday++;
    }
  }
  return { boxes, retired };
}

/** "Nov 6" in the UI language; the year is added when it is not the current one. */
function shortDate(iso: string, language: Language, now: Date): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(
    language,
    date.getFullYear() === now.getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' }
  );
}

function fullDate(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Local calendar day as YYYY-MM-DD, for `<time dateTime>`. */
function isoDay(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function Dashboard() {
  const [sessions, setSessions] = useLocalStorage<StudySession[]>(STORAGE_KEYS.SESSIONS, []);
  const [providerSettings] = useMultiProviderSettings();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const now = new Date();
  const nowTime = now.getTime();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const providerReady = validateProviderConfig(
    providerSettings.currentProvider,
    providerSettings.providers[providerSettings.currentProvider],
    language
  ).valid;

  const weekStart = nowTime - 7 * DAY_MS;
  const allTime = summarize(sessions);
  const lastWeek = summarize(sessions.filter((s) => Date.parse(s.createdAt) >= weekStart));

  // Due slip: overdue is due before today began, due today is due since then up to now
  const scheduled = scheduledReviews(sessions);
  const due = scheduled.filter((review) => review.due <= nowTime);
  const later = scheduled.filter((review) => review.due > nowTime);
  const overdueCount = due.filter((review) => review.due < startOfToday).length;
  const dueTodayCount = due.length - overdueCount;
  const dueThisWeekCount = later.filter((review) => review.due <= nowTime + 7 * DAY_MS).length;
  const slipDue = due.slice(0, SLIP_DUE_ROWS);
  const moreDue = due.length - slipDue.length;
  const slipLater = later.slice(0, due.length > 0 ? SLIP_LATER_ROWS : SLIP_LATER_ROWS_IDLE);
  const openReview = findOpenReviewSession(sessions, now);
  const { boxes, retired } = summarizeBoxes(sessions, nowTime, startOfToday);
  const onLoanCount = boxes.reduce((sum, box) => sum + box.count, 0);

  // Newest first by start time; review sessions are resumed through the review action
  const newestFirst = [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const activeSessions = newestFirst
    .filter((s) => s.status === 'active' && s.kind !== 'review')
    .slice(0, UNFINISHED_SESSIONS);
  const recentSessions = newestFirst.slice(0, RECENT_SESSIONS);
  const extentScale = mostAnswered(sessions);

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
  const sessionScoreText = (session: StudySession) =>
    answeredCount(session.questions) > 0 ? `${sessionScore(session.questions)}%` : '—';
  // "Multiple choice · 4 questions answered · 75% correct"
  const sessionDetails = (session: StudySession) => {
    const answered = answeredCount(session.questions);
    const parts = [
      session.questionType === 'dissertative'
        ? t.dissertative
        : session.questionType === 'mixed'
          ? t.mixed
          : t.multipleChoice,
      formatMessage(answered === 1 ? t.dashboardAnsweredCountOne : t.dashboardAnsweredCountOther, { count: answered }),
    ];
    if (answered > 0) {
      parts.push(formatMessage(t.dashboardPercentCorrect, { percent: sessionScore(session.questions) }));
    }
    return parts.join(' · ');
  };
  const statusText = (session: StudySession) =>
    session.status === 'active' ? (
      <span className="font-semibold text-accent-ink">{t.inProgress}</span>
    ) : (
      <span className="text-ink-muted">{t.sessionStatusCompleted}</span>
    );

  const boxInterval = (box: number) => {
    const days = REVIEW_INTERVAL_DAYS[box - 1];
    return formatMessage(days === 1 ? t.dashboardBoxIntervalOne : t.dashboardBoxIntervalOther, { box, days });
  };
  const reviewTopic = (review: ScheduledReview) => review.question.context ?? review.session.contexts.join(' · ');
  const reviewCallNumber = (review: ScheduledReview) =>
    callNumber(review.question.context ?? review.session.contexts[0] ?? '', review.box);
  // A not-yet-due question due later today carries its time, so it never prints the due stamp
  const laterStampText = (due: number) =>
    due < startOfTomorrow ? stampDateTime(new Date(due), language) : stampDate(new Date(due), language);
  const dueStamp = (review: ScheduledReview) => {
    const date = new Date(review.due);
    if (review.due > nowTime) return <span className="stamp stamp-later">{laterStampText(review.due)}</span>;
    if (review.due >= startOfToday) return <span className="stamp">{stampDate(date, language)}</span>;
    const withYear = date.getFullYear() !== now.getFullYear();
    return (
      <span className="stamp stamp-overdue">
        {formatMessage(t.dashboardOverdueStamp, { date: stampDate(date, language, withYear) })}
      </span>
    );
  };

  const slipRow = (review: ScheduledReview, isLater: boolean) => {
    const topic = reviewTopic(review);
    return (
      <tr key={`${review.session.id}:${review.question.id}`} className={isLater ? 'is-later' : undefined}>
        <td>
          <span className={`callno ${isLater ? 'text-ink-muted' : ''}`}>{reviewCallNumber(review)}</span>
        </td>
        <td>
          <p className={`truncate ${isLater ? '' : 'font-medium'}`} title={review.question.question}>
            {review.question.question}
          </p>
          <p className="truncate text-sm text-ink-muted xl:hidden" title={topic}>
            {topic}
          </p>
        </td>
        <td className="hidden xl:table-cell">
          <p className="truncate text-ink-muted" title={topic}>
            {topic}
          </p>
        </td>
        <td className="whitespace-nowrap text-sm">{boxInterval(review.box)}</td>
        <td>{dueStamp(review)}</td>
      </tr>
    );
  };

  const slipItem = (review: ScheduledReview, isLater: boolean) => (
    <li
      key={`${review.session.id}:${review.question.id}`}
      className={`border-b px-4 py-3 last:border-b-0 ${SLIP_ROW_LINE}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`callno ${isLater ? 'text-ink-muted' : ''}`}>{reviewCallNumber(review)}</span>
        {dueStamp(review)}
      </div>
      <p className={`mt-1.5 line-clamp-2 ${isLater ? 'text-ink-muted' : 'font-medium text-ink'}`}>
        {review.question.question}
      </p>
      <p className="mt-0.5 flex gap-1 text-sm text-ink-muted">
        <span className="truncate">{reviewTopic(review)}</span>
        <span aria-hidden="true">·</span>
        <span className="shrink-0 whitespace-nowrap">{boxInterval(review.box)}</span>
      </p>
    </li>
  );

  // Loan periods axis; ticks a narrow track cannot fit are dropped, measured on the track itself
  const axisTicks = (
    <div className="relative h-3.5 min-w-[3.5rem] [container-type:inline-size]">
      {AXIS_TICKS.map((day) => (
        <span
          key={day}
          className={`absolute top-0 whitespace-nowrap ${
            day === 0
              ? 'hidden [@container(min-width:5.5rem)]:inline'
              : day === AXIS_DAYS
                ? '-translate-x-full'
                : 'hidden -translate-x-1/2 [@container(min-width:10rem)]:inline'
          }`}
          style={{ left: `${(day / AXIS_DAYS) * 100}%` }}
        >
          {day === AXIS_DAYS ? formatMessage(t.dashboardAxisDays, { days: day }) : day}
        </span>
      ))}
    </div>
  );
  // A box's loan period from day 0 to its interval; its due share sits at the end, red only when overdue
  const loanTrack = (box: BoxSummary, days: number) => {
    const share = (part: number) => `${(part / box.count) * 100}%`;
    const notYetDue = box.count - box.overdue - box.dueToday;
    return (
      <div className="loan-track">
        <div
          className={`loan-bar divide-x divide-surface ${box.count === 0 ? 'bg-line' : ''}`}
          style={{ width: `${(days / AXIS_DAYS) * 100}%` }}
        >
          {notYetDue > 0 && <div className="loan-later" style={{ width: share(notYetDue) }} />}
          {box.dueToday > 0 && <div className="loan-today" style={{ width: share(box.dueToday) }} />}
          {box.overdue > 0 && <div className="loan-overdue" style={{ width: share(box.overdue) }} />}
        </div>
      </div>
    );
  };
  // The DUE figure: red only with overdue questions, violet when due today, muted at 0
  const dueTone = (box: BoxSummary) =>
    box.overdue > 0 ? 'font-bold text-error-ink' : box.dueToday > 0 ? 'font-bold text-accent-ink' : 'text-ink-muted';

  const progressRows: [string, ProgressSummary][] = [
    [t.dashboardLast7Days, lastWeek],
    [t.dashboardAllTime, allTime],
  ];

  const longDate = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  return (
    <div className="page lg:pt-5">
      <header className="page-header">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="page-title">{t.dashboard}</h1>
          <p className="page-lede">
            <time dateTime={isoDay(now)}>{longDate}</time>
          </p>
        </div>
        {sessions.length > 0 && (
          <Link to="/study" className="btn btn-secondary">
            <Plus aria-hidden="true" />
            {t.newSession}
          </Link>
        )}
      </header>

      {!providerReady && (
        <div className="notice notice-warning mt-4">
          <AlertTriangle aria-hidden="true" />
          <p>
            {t.dashboardProviderNotReady}{' '}
            <Link to="/settings" className="font-medium underline">
              {t.dashboardOpenSettings}
            </Link>
          </p>
        </div>
      )}

      {sessions.length === 0 ? (
        <section aria-labelledby="first-session-heading" className="panel mt-4">
          <div className="panel-body max-w-measure">
            <h2 id="first-session-heading" className="text-lg font-semibold text-ink">
              {t.noSessionsYet}
            </h2>
            <p className="mt-1 text-ink-soft">{t.noSessionsYetDesc}</p>
            <Link to="/study" className="btn btn-primary mt-4">
              {t.startFirstSession}
            </Link>
          </div>
        </section>
      ) : (
        // Phones read the panels in DOM order; from xl the grid places them as two columns
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_26.5rem]">
          <section aria-labelledby="progress-heading" className="panel min-w-0 xl:col-start-1 xl:row-start-1">
            <div className="panel-head">
              <h2 id="progress-heading" className="panel-title">
                {t.dashboardProgress}
              </h2>
            </div>
            <table className="data-table [&_td]:py-2 [&_tbody_th]:py-2">
              <thead>
                <tr>
                  <td />
                  <th scope="col" className="num">
                    {t.dashboardSessions}
                  </th>
                  <th scope="col" className="num">
                    {t.dashboardAnswered}
                  </th>
                  <th scope="col" className="num">
                    {t.dashboardAccuracy}
                  </th>
                </tr>
              </thead>
              <tbody>
                {progressRows.map(([label, summary]) => (
                  <tr key={label}>
                    <th scope="row" className="sm:whitespace-nowrap">
                      <span className="font-semibold">{label}</span>
                    </th>
                    <td className="num">
                      <span className="figure text-[1.5rem] sm:text-[1.75rem]">{summary.sessions}</span>
                    </td>
                    <td className="num">
                      <span className="figure text-[1.5rem] sm:text-[1.75rem]">{summary.answered}</span>
                    </td>
                    <td className="num">
                      <span className="figure text-[1.5rem] sm:text-[1.75rem]">
                        {summary.accuracy === undefined ? '—' : `${summary.accuracy}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="slip-heading" className="panel min-w-0 xl:col-span-2 xl:row-start-2">
            <div className="slip-head flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-5 xl:py-2.5">
              <h2 id="slip-heading" className="text-2xl font-extrabold leading-tight tracking-[-0.015em] text-ink">
                {t.dashboardDueForReturn}
              </h2>
              {due.length > 0 ? (
                <p className="text-[0.9375rem] text-ink-muted tabular">
                  {overdueCount > 0 && (
                    <span className="font-bold text-error-ink">
                      {formatMessage(overdueCount === 1 ? t.dashboardOverdueOne : t.dashboardOverdueOther, {
                        count: overdueCount,
                      })}
                    </span>
                  )}
                  {overdueCount > 0 && dueTodayCount > 0 && ' · '}
                  {dueTodayCount > 0 && formatMessage(t.dashboardDueToday, { count: dueTodayCount })}
                  {dueThisWeekCount > 0 && ` · ${formatMessage(t.dashboardDueThisWeek, { count: dueThisWeekCount })}`}
                </p>
              ) : (
                later.length > 0 && (
                  <p className="text-[0.9375rem] text-ink-muted tabular">
                    {formatMessage(t.dashboardNextReturn, { date: laterStampText(later[0].due) })}
                  </p>
                )
              )}
              {due.length > 0 && (
                <button type="button" onClick={startReview} className="btn btn-primary w-full sm:ml-auto sm:w-auto">
                  {formatMessage(openReview ? t.dashboardResumeReview : t.dashboardStartReview, {
                    count: due.length,
                  })}
                </button>
              )}
            </div>

            {scheduled.length === 0 ? (
              <p className="max-w-measure px-4 py-4 text-[0.9375rem] text-ink-muted sm:px-5">
                {t.dashboardNothingOnLoan}
              </p>
            ) : (
              <>
                {/* From xl each row is one line, so rows and the group label sit tighter */}
                <table className="slip hidden table-fixed md:table xl:[&_.slip-group_td]:pt-2 xl:[&_td]:py-1.5">
                  <thead>
                    <tr>
                      <th scope="col" className="w-[6.5rem]">
                        {t.dashboardCallNo}
                      </th>
                      <th scope="col">{t.question}</th>
                      <th scope="col" className="hidden w-[24%] xl:table-cell">
                        {t.dashboardTopic}
                      </th>
                      <th scope="col" className="w-[9.5rem]">
                        {t.dashboardBox}
                      </th>
                      <th scope="col" className="w-[11rem]">
                        {t.dashboardDueDateColumn}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {slipDue.map((review) => slipRow(review, false))}
                    {moreDue > 0 && (
                      <tr>
                        <td colSpan={4}>
                          <span className="text-sm text-ink-muted">
                            {formatMessage(t.dashboardMoreDue, { count: moreDue })}
                          </span>
                        </td>
                        {/* The topic column exists only from xl; this cell closes the row there */}
                        <td className="hidden xl:table-cell" />
                      </tr>
                    )}
                    {slipLater.length > 0 && (
                      <tr className="slip-group">
                        <td colSpan={4}>{t.dashboardNotYetDue}</td>
                        <td className="hidden xl:table-cell" />
                      </tr>
                    )}
                    {slipLater.map((review) => slipRow(review, true))}
                  </tbody>
                </table>

                <div className="md:hidden">
                  {slipDue.length > 0 && <ul>{slipDue.map((review) => slipItem(review, false))}</ul>}
                  {moreDue > 0 && (
                    <p className={`border-t px-4 py-3 text-sm text-ink-muted ${SLIP_ROW_LINE}`}>
                      {formatMessage(t.dashboardMoreDue, { count: moreDue })}
                    </p>
                  )}
                  {slipLater.length > 0 && (
                    <>
                      <h3 className="caps-label px-4 pb-1.5 pt-4">{t.dashboardNotYetDue}</h3>
                      <ul>{slipLater.map((review) => slipItem(review, true))}</ul>
                    </>
                  )}
                </div>
              </>
            )}
          </section>

          <section
            aria-labelledby="unfinished-heading"
            className="panel min-w-0 xl:col-start-2 xl:row-start-1"
          >
            <div className="panel-head">
              <h2 id="unfinished-heading" className="panel-title">
                {activeSessions.length > 1 ? t.dashboardUnfinishedOther : t.dashboardUnfinishedOne}
              </h2>
              {activeSessions.length === 1 && (
                <span className="callno text-ink-muted">{sessionCallNumber(activeSessions[0].contexts)}</span>
              )}
            </div>
            {activeSessions.length === 0 && (
              <div className="panel-body py-3">
                <p className="font-semibold text-ink">{t.dashboardNoUnfinished}</p>
                <p className="mt-0.5 text-sm text-ink-muted">{t.dashboardNoUnfinishedDesc}</p>
                <Link to="/study" className={`btn mt-3 ${due.length === 0 ? 'btn-primary' : 'btn-secondary'}`}>
                  <Plus aria-hidden="true" />
                  {t.newSession}
                </Link>
              </div>
            )}
            {activeSessions.length === 1 &&
              activeSessions.map((session) => {
                const topics = session.contexts.join(' · ');
                return (
                  <div key={session.id} className="panel-body py-3">
                    <p className="text-base font-semibold text-ink [overflow-wrap:anywhere]">{topics}</p>
                    <p className="mt-0.5 text-sm text-ink-muted tabular">{sessionDetails(session)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <button
                        type="button"
                        onClick={() => navigate('/study', { state: { sessionId: session.id } })}
                        aria-label={formatMessage(t.dashboardResumeAria, { topics })}
                        className="btn btn-secondary"
                      >
                        {t.dashboardResume}
                      </button>
                      <span className="text-sm text-ink-muted tabular">
                        {formatMessage(t.dashboardStarted, { date: fullDate(session.createdAt, language) })}
                      </span>
                    </div>
                  </div>
                );
              })}
            {activeSessions.length > 1 && (
              <ul className="divide-y divide-line">
                {activeSessions.map((session) => {
                  const topics = session.contexts.join(' · ');
                  return (
                    <li key={session.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-baseline gap-2">
                          <span className="callno text-ink-muted">{sessionCallNumber(session.contexts)}</span>
                          <span className="truncate font-semibold text-ink" title={topics}>
                            {topics}
                          </span>
                        </p>
                        <p className="mt-0.5 text-sm text-ink-muted tabular">{sessionDetails(session)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/study', { state: { sessionId: session.id } })}
                        aria-label={formatMessage(t.dashboardResumeAria, { topics })}
                        className="btn btn-secondary shrink-0"
                      >
                        {t.dashboardResume}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="loan-heading" className="panel min-w-0 xl:col-start-2 xl:row-start-3">
            <div className="panel-head">
              <h2 id="loan-heading" className="panel-title">
                {t.dashboardLoanPeriods}
              </h2>
              <p className="panel-meta tabular">
                {formatMessage(onLoanCount === 1 ? t.dashboardOnLoanCountOne : t.dashboardOnLoanCountOther, {
                  count: onLoanCount,
                })}{' '}
                ·{' '}
                {formatMessage(retired === 1 ? t.dashboardRetiredCountOne : t.dashboardRetiredCountOther, {
                  count: retired,
                })}
              </p>
            </div>
            {/* Every box drawn from day 0 to its interval on one 0-30 day axis; the sr-only table carries the figures */}
            <table aria-hidden="true" className="data-table hidden sm:table [&_td]:py-1">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">{t.dashboardBox}</th>
                  <th className="w-full">{axisTicks}</th>
                  <th className="num whitespace-nowrap">{t.dashboardOnLoanColumn}</th>
                  <th className="num whitespace-nowrap">{t.dashboardDueColumn}</th>
                </tr>
              </thead>
              <tbody>
                {boxes.map((box, index) => {
                  const days = REVIEW_INTERVAL_DAYS[index];
                  return (
                    <tr key={days}>
                      <td className="whitespace-nowrap">
                        <span className="font-semibold">{formatMessage(t.dashboardBoxNumber, { box: index + 1 })}</span>{' '}
                        <span className="ml-1 text-ink-muted">{formatMessage(t.dashboardDays, { days })}</span>
                      </td>
                      <td>{loanTrack(box, days)}</td>
                      <td className="num">{box.count}</td>
                      <td className="num">
                        <span className={dueTone(box)}>{box.overdue + box.dueToday}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="whitespace-nowrap font-semibold">{t.dashboardRetired}</td>
                  <td />
                  <td className="num">{retired}</td>
                  <td className="num">
                    <span className="text-ink-muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
            {/* Phones: one row per box with its counts above a full-width track */}
            <div aria-hidden="true" className="sm:hidden">
              <div className="caps-label border-b border-line px-4 pb-2 pt-3">{axisTicks}</div>
              <ul className="divide-y divide-line">
                {boxes.map((box, index) => {
                  const days = REVIEW_INTERVAL_DAYS[index];
                  const dueCount = box.overdue + box.dueToday;
                  return (
                    <li key={days} className="px-4 py-3">
                      <p className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                        <span className="whitespace-nowrap">
                          <span className="font-semibold">{formatMessage(t.dashboardBoxNumber, { box: index + 1 })}</span>{' '}
                          <span className="ml-1 text-ink-muted">{formatMessage(t.dashboardDays, { days })}</span>
                        </span>
                        <span className="text-right text-ink-muted tabular">
                          {formatMessage(box.count === 1 ? t.dashboardOnLoanCountOne : t.dashboardOnLoanCountOther, {
                            count: box.count,
                          })}
                          {dueCount > 0 && (
                            <>
                              {' · '}
                              <span className={dueTone(box)}>
                                {formatMessage(dueCount === 1 ? t.dashboardDueCountOne : t.dashboardDueCountOther, {
                                  count: dueCount,
                                })}
                              </span>
                            </>
                          )}
                        </span>
                      </p>
                      {loanTrack(box, days)}
                    </li>
                  );
                })}
                <li className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-semibold">{t.dashboardRetired}</span>
                  <span className="text-ink-muted tabular">{retired}</span>
                </li>
              </ul>
            </div>
            <table className="sr-only">
              <caption>{t.dashboardLoanPeriods}</caption>
              <thead>
                <tr>
                  <th scope="col">{t.dashboardBox}</th>
                  <th scope="col">{t.dashboardOnLoanColumn}</th>
                  <th scope="col">{t.dashboardDueColumn}</th>
                </tr>
              </thead>
              <tbody>
                {boxes.map((box, index) => (
                  <tr key={REVIEW_INTERVAL_DAYS[index]}>
                    <th scope="row">{boxInterval(index + 1)}</th>
                    <td>{box.count}</td>
                    <td>{box.overdue + box.dueToday}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">{t.dashboardRetired}</th>
                  <td>{retired}</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section aria-labelledby="recent-heading" className="panel min-w-0 xl:col-start-1 xl:row-start-3">
            <div className="panel-head">
              <h2 id="recent-heading" className="panel-title">
                {t.recentSessions}
              </h2>
              <Link
                to="/history"
                className="-my-2 inline-flex min-h-10 items-center text-sm font-semibold text-accent-ink underline"
              >
                {t.dashboardAllHistory}
              </Link>
            </div>

            <table className="data-table hidden sm:table [&_td]:py-1.5">
              <thead>
                <tr>
                  <th scope="col" className="whitespace-nowrap">
                    {t.dashboardCallNo}
                  </th>
                  <th scope="col" className="w-full">
                    {t.dashboardTopics}
                  </th>
                  <th scope="col" className="num whitespace-nowrap">
                    {t.questions}
                  </th>
                  <th scope="col" className="num whitespace-nowrap">
                    {t.score}
                  </th>
                  <th scope="col" className="whitespace-nowrap">
                    {t.date}
                  </th>
                  <th scope="col" className="whitespace-nowrap">
                    {t.dashboardStatus}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session) => {
                  const topics = session.contexts.join(' · ');
                  const answered = answeredCount(session.questions);
                  return (
                    <tr key={session.id}>
                      <td>
                        <span className="callno">{sessionCallNumber(session.contexts)}</span>
                      </td>
                      <td className="max-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <Link
                            to={`/session/${session.id}`}
                            title={topics}
                            className="truncate font-medium text-ink underline decoration-line-strong hover:decoration-ink"
                          >
                            {topics}
                          </Link>
                          {session.kind === 'review' && <span className="tag shrink-0">{t.reviewSessionLabel}</span>}
                        </div>
                      </td>
                      <td className="num whitespace-nowrap">
                        <ExtentBar session={session} scale={extentScale} className="mr-2" />
                        <span className="inline-block min-w-[2ch]">{answered}</span>
                      </td>
                      <td className="num">{sessionScoreText(session)}</td>
                      <td className="whitespace-nowrap tabular">{shortDate(session.createdAt, language, now)}</td>
                      <td className="whitespace-nowrap">{statusText(session)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul className="divide-y divide-line sm:hidden">
              {recentSessions.map((session) => {
                const topics = session.contexts.join(' · ');
                const answered = answeredCount(session.questions);
                return (
                  <li key={session.id}>
                    <Link to={`/session/${session.id}`} className="flex flex-col px-4 py-3 hover:bg-sunken">
                      <span className="flex items-baseline gap-2">
                        <span className="callno">{sessionCallNumber(session.contexts)}</span>
                        <span className="truncate font-medium text-ink">{topics}</span>
                        {session.kind === 'review' && <span className="tag shrink-0">{t.reviewSessionLabel}</span>}
                        <span className="ml-auto shrink-0 pl-1 text-sm">{statusText(session)}</span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-x-2 text-sm text-ink-muted tabular">
                        <span className="inline-flex items-center gap-1.5">
                          <ExtentBar session={session} scale={extentScale} />
                          {formatMessage(answered === 1 ? t.questionCountOne : t.questionCountOther, {
                            count: answered,
                          })}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{sessionScoreText(session)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{shortDate(session.createdAt, language, now)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      <div className="mt-8 max-w-measure space-y-1 text-sm text-ink-muted">
        <p>
          {t.dataTipDesc}{' '}
          <Link to="/settings" className="font-medium text-accent-ink underline">
            {t.dashboardOpenSettings}
          </Link>
        </p>
        {PATREON_URL && (
          <p>
            {t.dashboardSupportLine}{' '}
            <a
              href={PATREON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-ink underline"
            >
              {t.supportOnPatreon}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
