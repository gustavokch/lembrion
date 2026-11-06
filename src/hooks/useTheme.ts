import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Theme, ThemeConfig, ThemePreference, THEME_PREFERENCE_IDS } from '../core/types';
import { getTheme, resolveThemePreference, themeForPreference } from '../core/services/theme';
import { localStorage } from '../core/services/storage';
import { STORAGE_KEYS, DEFAULTS } from '../core/config/constants';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/** `null` where `matchMedia` is missing (jsdom, old browsers), which counts as light. */
function darkSchemeQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(DARK_SCHEME_QUERY) : null;
}

function systemPrefersDark(): boolean {
  return darkSchemeQuery()?.matches ?? false;
}

/**
 * Write a theme's colour tokens to `--color-*` on `<html>`, set
 * `data-theme` and `color-scheme`, and update `<meta name="theme-color">`.
 * Components style through the variables, so a change needs no reload.
 */
export function applyTheme(theme: Theme): void {
  const config = getTheme(theme);
  const root = document.documentElement;

  Object.entries(config.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  root.dataset.theme = config.id;
  delete root.dataset.boot;
  root.style.colorScheme = config.scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', config.colors.shell);
}

export function useTheme() {
  const [storedPreference, setStoredPreference] = useLocalStorage<ThemePreference>(
    STORAGE_KEYS.THEME,
    DEFAULTS.THEME as ThemePreference,
  );
  const preference = resolveThemePreference(storedPreference);
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);
  const currentTheme = themeForPreference(preference, prefersDark);

  // Apply at mount and when this instance's preference changes (its own choice
  // or another tab's). A system change is left to the listener below, because
  // this instance's preference may be stale.
  useEffect(() => {
    applyTheme(themeForPreference(preference, systemPrefersDark()));
  }, [preference]);

  useEffect(() => {
    const query = darkSchemeQuery();
    if (!query) return;
    const onChange = () => {
      setPrefersDark(query.matches);
      // Read storage, not this instance's state: `Layout` and `ThemeSelector`
      // each hold a `useTheme()`, and a choice made in one does not reach the other.
      const stored = resolveThemePreference(localStorage.getItem<unknown>(STORAGE_KEYS.THEME, DEFAULTS.THEME));
      if (stored === 'system') applyTheme(themeForPreference(stored, query.matches));
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const changeTheme = useCallback(
    (next: ThemePreference) => {
      applyTheme(themeForPreference(next, systemPrefersDark()));
      setStoredPreference(next);
    },
    [setStoredPreference],
  );

  return {
    preference,
    /** The palette on screen: `preference`, with `system` resolved. */
    currentTheme,
    themeConfig: getTheme(currentTheme),
    changeTheme,
    preferences: THEME_PREFERENCE_IDS,
  };
}

export type { Theme, ThemeConfig, ThemePreference };
