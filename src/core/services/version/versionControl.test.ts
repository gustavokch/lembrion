import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_VERSION, STORAGE_KEYS } from '../../config/constants';
import { enUS } from '../i18n/translations/en-US';
import { handleVersionMigration } from './versionControl';

const settings = {
  currentProvider: 'anthropic',
  providers: { anthropic: { apiKey: 'sk-ant-secret', model: 'claude-haiku-5-5' } },
};
const sessions = [{ id: '1', subject: 'Biology', status: 'completed' }];

function stored(key: string): unknown {
  const raw = window.localStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
}

describe('handleVersionMigration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = '';
    vi.useFakeTimers();
    // Safari path: no requestIdleCallback
    vi.stubGlobal('requestIdleCallback', undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps provider settings and sessions, clears other app data, and ends on the current version', () => {
    window.localStorage.setItem(STORAGE_KEYS.MULTI_PROVIDER_SETTINGS, JSON.stringify(settings));
    window.localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    window.localStorage.setItem(STORAGE_KEYS.VERSION, JSON.stringify('2.6.2'));
    window.localStorage.setItem('studorama-question-cache', JSON.stringify({ stale: true }));
    window.localStorage.setItem('other-app-key', 'untouched');

    expect(handleVersionMigration()).toBe(true);

    // The clear is synchronous
    expect(window.localStorage.getItem('studorama-question-cache')).toBeNull();

    // A key written after the migration started must survive any deferred work
    window.localStorage.setItem('studorama-written-later', JSON.stringify('kept'));
    vi.advanceTimersByTime(50);

    expect(stored(STORAGE_KEYS.VERSION)).toBe(APP_VERSION);
    expect(stored(STORAGE_KEYS.MULTI_PROVIDER_SETTINGS)).toEqual(settings);
    expect(stored(STORAGE_KEYS.SESSIONS)).toEqual(sessions);
    expect(stored('studorama-written-later')).toBe('kept');
    expect(window.localStorage.getItem('other-app-key')).toBe('untouched');
    expect(document.body.textContent).toContain(enUS.dataRefreshed);
  });

  it('does not migrate again once the current version is stored', () => {
    window.localStorage.setItem(STORAGE_KEYS.VERSION, JSON.stringify('2.6.2'));
    expect(handleVersionMigration()).toBe(true);
    vi.advanceTimersByTime(50);

    expect(handleVersionMigration()).toBe(false);
  });
});
