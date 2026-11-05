import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enUS } from '../core/services/i18n/translations/en-US';
import { useLocalStorage } from './useLocalStorage';

type Setter = (value: string[] | ((prev: string[]) => string[])) => void;

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root;
let container: HTMLDivElement;

function mountHook(key: string): { current: () => readonly [string[], Setter] } {
  let latest: readonly [string[], Setter] | undefined;
  function Probe() {
    latest = useLocalStorage<string[]>(key, []);
    return null;
  }
  act(() => root.render(createElement(Probe)));
  return { current: () => latest! };
}

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
  });

  it('persists the new value before setValue returns', () => {
    const hook = mountHook('studorama-sessions');

    let persistedDuringSet: string | null = null;
    act(() => {
      hook.current()[1](prev => [...prev, 'session-1']);
      persistedDuringSet = window.localStorage.getItem('studorama-sessions');
    });

    expect(persistedDuringSet).toBe(JSON.stringify(['session-1']));
    expect(hook.current()[0]).toEqual(['session-1']);
  });

  it('tells the user when the browser refuses the write', () => {
    const hook = mountHook('studorama-sessions');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });

    act(() => {
      hook.current()[1](['session-1']);
    });

    expect(document.body.textContent).toContain(enUS.storageWriteFailed);
    expect(hook.current()[0]).toEqual(['session-1']);
  });
});
