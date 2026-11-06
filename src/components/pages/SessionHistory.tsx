import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { STORAGE_KEYS } from '../../core/config/constants';
import { formatDate, formatMessage } from '../../core/services';
import { useLanguage } from '../../hooks/useLanguage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { StudySession } from '../../types';
import { sessionCallNumber } from '../callNumber';
import SessionEditModal from '../SessionEditModal';
import { applySessionEditById, SessionEditUpdates } from './sessionEdits';
import ExtentBar from '../ui/ExtentBar';
import { answeredCount, mostAnswered, sessionScore } from './StudyPage/learningTechniques';

type StatusFilter = 'all' | 'active' | 'completed';

export default function SessionHistory() {
  const [sessions, setSessions] = useLocalStorage<StudySession[]>(STORAGE_KEYS.SESSIONS, []);
  const { t, language } = useLanguage();
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');

  // Sort and filter sessions
  const filteredSessions = useMemo(() => {
    return sessions
      .filter(session => {
        const matchesSearch = (session.contexts?.join(', ') || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || session.status === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [sessions, searchQuery, filterStatus, sortOrder]);

  const handleEditSession = (session: StudySession) => {
    setEditingSession(session);
  };

  const handleSaveSession = (sessionId: string, updates: SessionEditUpdates) => {
    setSessions(prevSessions => applySessionEditById(prevSessions, sessionId, updates));
    setEditingSession(null);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    setSelectedSessions([]);
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const selectAllSessions = () => {
    setSelectedSessions(filteredSessions.map(s => s.id));
  };

  const deselectAllSessions = () => {
    setSelectedSessions([]);
  };

  const requestDeleteSession = (sessionId: string) => {
    setSelectedSessions([sessionId]);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    if (!isSelectionMode) setSelectedSessions([]);
  };

  const deleteSelectedSessions = () => {
    setSessions(prev => prev.filter(session => !selectedSessions.includes(session.id)));
    setSelectedSessions([]);
    setIsSelectionMode(false);
    setShowDeleteConfirm(false);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
  };

  const topicsOf = (session: StudySession) => session.contexts.join(' · ');

  const typeLabel = (session: StudySession) => {
    switch (session.questionType) {
      case 'multipleChoice':
        return t.multipleChoice;
      case 'dissertative':
        return t.dissertative;
      case 'mixed':
        return t.mixed;
      default:
        return '—';
    }
  };

  const scoreLabel = (session: StudySession) =>
    answeredCount(session.questions) > 0 ? `${sessionScore(session.questions)}%` : '—';

  const extentScale = mostAnswered(sessions);

  const statusTag = (session: StudySession) =>
    session.status === 'active' ? (
      <span className="tag tag-accent">{t.historyStatusActive}</span>
    ) : (
      <span className="tag">{t.sessionStatusCompleted}</span>
    );

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t.all },
    { value: 'active', label: t.historyStatusActive },
    { value: 'completed', label: t.completed },
  ];

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <h1 className="page-title">{t.studyHistory}</h1>
        </header>
        <div className="panel mt-6">
          <div className="panel-body sm:py-6">
            <p className="text-base font-semibold text-ink">{t.noSessionsYet}</p>
            <p className="mt-1 max-w-measure text-ink-soft">{t.noSessionsYetDesc}</p>
            <Link to="/study" className="btn btn-primary mt-5">
              {t.startFirstSession}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rowActions = (session: StudySession, size: 'sm' | 'md') => {
    const topics = topicsOf(session);
    return (
      <>
        {session.status === 'active' && (
          <>
            <Link
              to="/study"
              state={{ sessionId: session.id }}
              className={`btn btn-secondary ${size === 'sm' ? 'btn-sm' : ''}`}
            >
              {t.historyResume}
            </Link>
            <button
              type="button"
              onClick={() => handleEditSession(session)}
              className="btn btn-ghost btn-icon"
              aria-label={formatMessage(t.historyEditAria, { topics })}
              title={t.edit}
            >
              <Pencil aria-hidden="true" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => requestDeleteSession(session.id)}
          className="btn btn-ghost btn-icon"
          aria-label={formatMessage(t.historyDeleteAria, { topics })}
          title={t.delete}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </>
    );
  };

  const selectBox = (session: StudySession) => (
    <label className="-m-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={selectedSessions.includes(session.id)}
        onChange={() => toggleSessionSelection(session.id)}
        aria-label={formatMessage(t.historySelectAria, { topics: topicsOf(session) })}
      />
    </label>
  );

  return (
    <div className="page">
      <header className="page-header">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="page-title">{t.studyHistory}</h1>
          <p className="page-lede tabular">
            {formatMessage(sessions.length === 1 ? t.historySessionCountOne : t.historySessionCountOther, { count: sessions.length })}
          </p>
        </div>
        <Link to="/study" className="btn btn-primary">
          <Plus aria-hidden="true" />
          {t.newSession}
        </Link>
      </header>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="history-search" className="sr-only">
            {t.historySearchLabel}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <input
            id="history-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchSessions}
            className="field pl-9"
          />
        </div>
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="segmented" role="group" aria-label={t.historyStatusFilter}>
            {statusFilters.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filterStatus === value}
                onClick={() => setFilterStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleSelectionMode}
            aria-pressed={isSelectionMode}
            className="btn btn-ghost -mr-2"
          >
            {isSelectionMode ? t.historyDoneSelecting : t.historySelect}
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="panel mt-4 overflow-hidden">
        {/* Selection bar */}
        {isSelectionMode && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-sunken px-3 py-2 sm:px-4">
            <span className="mr-2 text-sm font-semibold text-ink tabular" aria-live="polite">
              {formatMessage(selectedSessions.length === 1 ? t.selectedCountOne : t.selectedCountOther, { count: selectedSessions.length })}
            </span>
            <button type="button" onClick={selectAllSessions} className="btn btn-ghost">
              {t.selectAll}
            </button>
            <button type="button" onClick={deselectAllSessions} className="btn btn-ghost">
              {t.clear}
            </button>
            <button
              type="button"
              onClick={() => selectedSessions.length > 0 && setShowDeleteConfirm(true)}
              disabled={selectedSessions.length === 0}
              className="btn btn-danger sm:ml-auto"
            >
              <Trash2 aria-hidden="true" />
              {t.deleteSelected}
            </button>
          </div>
        )}

        {filteredSessions.length === 0 ? (
          <div className="panel-body sm:py-6">
            <p className="text-base font-semibold text-ink">{t.historyNoMatch}</p>
            <p className="mt-1 max-w-measure text-ink-soft">{t.adjustFilters}</p>
            <button type="button" onClick={clearFilters} className="btn btn-secondary mt-5">
              {t.historyClearFilters}
            </button>
          </div>
        ) : (
          <>
            {/* md and up: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table [&_td]:py-1.5 [&_th]:pt-3">
                <thead>
                  <tr>
                    {isSelectionMode && (
                      <th scope="col" className="w-10">
                        <span className="sr-only">{t.historySelect}</span>
                      </th>
                    )}
                    <th scope="col" className="w-24">{t.historyColCallNo}</th>
                    <th scope="col">{t.historyColTopics}</th>
                    <th scope="col" className="hidden lg:table-cell">{t.historyColType}</th>
                    <th scope="col" className="num">{t.questions}</th>
                    <th scope="col" className="num">{t.score}</th>
                    <th scope="col" aria-sort={sortOrder === 'desc' ? 'descending' : 'ascending'}>
                      <button
                        type="button"
                        onClick={toggleSortOrder}
                        className="inline-flex items-center gap-1 uppercase hover:text-ink"
                      >
                        {t.historyColStarted}
                        {sortOrder === 'desc' ? (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                    </th>
                    <th scope="col">{t.historyColStatus}</th>
                    {!isSelectionMode && (
                      <th scope="col">
                        <span className="sr-only">{t.historyColActions}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(session => (
                    <tr key={session.id}>
                      {isSelectionMode && <td>{selectBox(session)}</td>}
                      <td className="callno">{sessionCallNumber(session.contexts)}</td>
                      <td>
                        <Link to={`/session/${session.id}`} className="font-medium text-ink hover:underline">
                          {topicsOf(session)}
                        </Link>
                        {session.kind === 'review' && <span className="tag ml-2">{t.reviewSessionLabel}</span>}
                      </td>
                      <td className="hidden whitespace-nowrap text-ink-soft lg:table-cell">{typeLabel(session)}</td>
                      <td className="num whitespace-nowrap">
                        <ExtentBar session={session} scale={extentScale} />
                        <span className="ml-2 inline-block min-w-[2ch]">{answeredCount(session.questions)}</span>
                      </td>
                      <td className="num">{scoreLabel(session)}</td>
                      <td className="tabular whitespace-nowrap text-ink-soft">{formatDate(session.createdAt, language)}</td>
                      <td>{statusTag(session)}</td>
                      {!isSelectionMode && (
                        <td>
                          <div className="flex items-center justify-end gap-1">{rowActions(session, 'sm')}</div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Below md: stacked rows */}
            <div className="md:hidden">
              <div className="border-b border-line px-1.5 py-1">
                <button type="button" onClick={toggleSortOrder} className="btn btn-ghost text-sm">
                  {t.historyColStarted}
                  {sortOrder === 'desc' ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}
                </button>
              </div>
              <ul className="divide-y divide-line">
                {filteredSessions.map(session => (
                  <li key={session.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      {isSelectionMode && selectBox(session)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="callno">{sessionCallNumber(session.contexts)}</span>
                          {statusTag(session)}
                        </div>
                        <Link
                          to={`/session/${session.id}`}
                          className="mt-1 block break-words font-semibold text-ink hover:underline"
                        >
                          {topicsOf(session)}
                        </Link>
                        <p className="mt-1 text-sm text-ink-muted tabular">{formatDate(session.createdAt, language)}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-sm text-ink-muted tabular">
                          <ExtentBar session={session} scale={extentScale} />
                          <span>
                            {formatMessage(answeredCount(session.questions) === 1 ? t.questionCountOne : t.questionCountOther, { count: answeredCount(session.questions) })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{t.score} {scoreLabel(session)}</span>
                        </p>
                        {session.kind === 'review' && <span className="tag mt-2">{t.reviewSessionLabel}</span>}
                      </div>
                    </div>
                    {!isSelectionMode && (
                      <div className="mt-2.5 flex items-center gap-1">{rowActions(session, 'md')}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          message={formatMessage(selectedSessions.length === 1 ? t.deleteSessionsConfirmOne : t.deleteSessionsConfirmOther, { count: selectedSessions.length })}
          onCancel={cancelDelete}
          onConfirm={deleteSelectedSessions}
        />
      )}

      {editingSession && (
        <SessionEditModal
          session={editingSession}
          isOpen={!!editingSession}
          onClose={() => setEditingSession(null)}
          onSave={(updates) => handleSaveSession(editingSession.id, updates)}
        />
      )}
    </div>
  );
}

interface DeleteConfirmDialogProps {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmDialog({ message, onCancel, onConfirm }: DeleteConfirmDialogProps) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Move focus in on open; return it to the trigger (or main) on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
      else document.getElementById('main-content')?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        className="w-full max-w-sm rounded-md border border-line bg-surface overlay-shadow"
      >
        <div className="panel-head">
          <h2 id="delete-dialog-title" className="text-lg font-bold leading-tight text-ink">
            {t.confirmDeletion}
          </h2>
        </div>
        <div className="panel-body">
          <p id="delete-dialog-desc" className="text-ink-soft">
            {message}
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button ref={cancelRef} type="button" onClick={onCancel} className="btn btn-secondary">
              {t.cancel}
            </button>
            <button type="button" onClick={onConfirm} className="btn btn-danger">
              {t.delete}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
