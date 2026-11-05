import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllAppData, getItem, setItem } from './localStorage';

describe('storage service', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('clearAllAppData removes every studorama key and keeps foreign keys', () => {
    setItem('studorama-sessions', [{ id: '1' }]);
    setItem('studorama-multi-provider-settings', { currentProvider: 'openai' });
    window.localStorage.setItem('studorama-unknown-future-key', '"x"');
    window.localStorage.setItem('other-app', 'keep');

    expect(getItem('studorama-sessions', [])).toEqual([{ id: '1' }]);

    clearAllAppData();

    expect(Object.keys(window.localStorage).sort()).toEqual(['other-app']);
    expect(getItem('studorama-sessions', [])).toEqual([]);
  });

  it('getItem returns a value written to localStorage by another tab since the last read', () => {
    setItem('studorama-sessions', [{ id: '1' }]);
    expect(getItem('studorama-sessions', [])).toEqual([{ id: '1' }]);

    window.localStorage.setItem('studorama-sessions', JSON.stringify([{ id: '2' }]));

    expect(getItem('studorama-sessions', [])).toEqual([{ id: '2' }]);
  });
});
