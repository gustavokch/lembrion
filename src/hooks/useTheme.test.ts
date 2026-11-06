import { act, createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemePreference } from '../core/types';
import { useTheme } from './useTheme';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root;
let systemDark: boolean;
let schemeListeners: Set<() => void>;

function setSystemDark(dark: boolean): void {
  act(() => {
    systemDark = dark;
    schemeListeners.forEach(listener => listener());
  });
}

/**
 * Mount two `useTheme()` instances, as the app does (`Layout` and
 * `ThemeSelector`), and return the menu's `changeTheme`.
 */
function mountShellAndMenu(): (preference: ThemePreference) => void {
  let changeTheme: ((preference: ThemePreference) => void) | undefined;
  function Menu() {
    changeTheme = useTheme().changeTheme;
    return null;
  }
  function Shell() {
    useTheme();
    return createElement(Menu);
  }
  act(() => root.render(createElement(Shell)));
  return preference => act(() => changeTheme!(preference));
}

const appliedTheme = () => document.documentElement.dataset.theme;

describe('useTheme', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    window.localStorage.clear();
    systemDark = false;
    schemeListeners = new Set();
    window.matchMedia = (media: string) =>
      ({
        media,
        get matches() {
          return systemDark;
        },
        addEventListener: (_type: string, listener: () => void) => schemeListeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => schemeListeners.delete(listener),
      }) as unknown as MediaQueryList;
    root = createRoot(document.createElement('div'));
  });

  afterEach(() => {
    act(() => root.unmount());
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('follows the system colour scheme live when nothing is stored', () => {
    mountShellAndMenu();
    expect(appliedTheme()).toBe('light');

    setSystemDark(true);
    expect(appliedTheme()).toBe('dark');

    setSystemDark(false);
    expect(appliedTheme()).toBe('light');
  });

  it('keeps a choice made in the menu when the system scheme changes', () => {
    const changeTheme = mountShellAndMenu();

    changeTheme('light');
    setSystemDark(true);
    expect(appliedTheme()).toBe('light');
    expect(window.localStorage.getItem('studorama-theme')).toBe('"light"');

    changeTheme('system');
    expect(appliedTheme()).toBe('dark');
    setSystemDark(false);
    expect(appliedTheme()).toBe('light');
  });

  it('uses the light palette for system where matchMedia is missing', () => {
    Reflect.deleteProperty(window, 'matchMedia');
    mountShellAndMenu();
    expect(appliedTheme()).toBe('light');
  });
});
