import { useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Theme, ThemeConfig } from '../core/types';
import { getAllThemes, getTheme, resolveTheme } from '../core/services/theme';
import { STORAGE_KEYS, DEFAULTS } from '../core/config/constants';

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
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>(STORAGE_KEYS.THEME, DEFAULTS.THEME as Theme);
  const currentTheme = resolveTheme(storedTheme);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const changeTheme = useCallback(
    (theme: Theme) => {
      applyTheme(theme);
      setStoredTheme(theme);
    },
    [setStoredTheme],
  );

  return {
    currentTheme,
    themeConfig: getTheme(currentTheme),
    changeTheme,
    themes: getAllThemes(),
  };
}

export type { Theme, ThemeConfig };
