import { Language, Theme, ThemeConfig, ThemePreference, THEME_IDS, THEME_PREFERENCE_IDS } from '../../types';
import { getTranslations } from '../i18n/translations';

export const themes: Record<Theme, ThemeConfig> = {
  light: {
    id: 'light',
    scheme: 'light',
    colors: {
      shell: '#23373b',
      shellInk: '#ffffff',
      shellMuted: '#b9c6c8',
      ground: '#fafafa',
      surface: '#ffffff',
      sunken: '#eef1f1',
      ink: '#23373b',
      inkSoft: '#45585c',
      inkMuted: '#5b6c70',
      line: '#dfe5e5',
      lineStrong: '#869699',
      primary: '#23373b',
      primaryHover: '#30494e',
      onPrimary: '#ffffff',
      accent: '#eb811b',
      accentInk: '#a8560a',
      success: '#14b03d',
      successInk: '#0d7a2a',
      error: '#d13a2e',
      errorInk: '#b3261e',
      warning: '#e0a526',
      warningInk: '#8a5a00',
      focus: '#23373b',
    },
  },

  dark: {
    id: 'dark',
    scheme: 'dark',
    colors: {
      shell: '#0f0f0f',
      shellInk: '#f5f5f5',
      shellMuted: '#a8a8a8',
      ground: '#161616',
      surface: '#1e1e1e',
      sunken: '#262626',
      ink: '#ededed',
      inkSoft: '#c9c9c9',
      inkMuted: '#a3a3a3',
      line: '#2e2e2e',
      lineStrong: '#737373',
      primary: '#ededed',
      primaryHover: '#ffffff',
      onPrimary: '#141414',
      accent: '#eb811b',
      accentInk: '#f39a45',
      success: '#2fc25a',
      successInk: '#5fd682',
      error: '#e5574b',
      errorInk: '#ff8a80',
      warning: '#e0a526',
      warningInk: '#f0c060',
      focus: '#f39a45',
    },
  },

  contrast: {
    id: 'contrast',
    scheme: 'light',
    colors: {
      shell: '#0b1416',
      shellInk: '#ffffff',
      shellMuted: '#d5dee0',
      ground: '#ffffff',
      surface: '#ffffff',
      sunken: '#f0f2f2',
      ink: '#000000',
      inkSoft: '#1d2a2c',
      inkMuted: '#3b4a4d',
      line: '#8a9a9c',
      lineStrong: '#4a5a5d',
      primary: '#0b1416',
      primaryHover: '#25373b',
      onPrimary: '#ffffff',
      accent: '#c25e00',
      accentInk: '#9a4a00',
      success: '#0a6b22',
      successInk: '#0a6b22',
      error: '#a3140b',
      errorInk: '#a3140b',
      warning: '#9a6700',
      warningInk: '#6b4700',
      focus: '#000000',
    },
  },
};

/**
 * Map a stored theme value to a current preference. Earlier releases shipped
 * ten themes: the dark ones become `dark`, any other string `light`. A missing
 * or non-string value follows the system.
 */
export function resolveThemePreference(value: unknown): ThemePreference {
  if (typeof value !== 'string') return 'system';
  if ((THEME_PREFERENCE_IDS as readonly string[]).includes(value)) return value as ThemePreference;
  if (value === 'midnight' || value === 'neon') return 'dark';
  return 'light';
}

/** The palette to show for a preference; `system` follows `prefersDark`. */
export function themeForPreference(preference: ThemePreference, prefersDark: boolean): Theme {
  if (preference !== 'system') return preference;
  return prefersDark ? 'dark' : 'light';
}

/** Never throws: an unknown id maps like a stored value, and `system` to light. */
export function getTheme(themeId: Theme): ThemeConfig {
  return themes[themeForPreference(resolveThemePreference(themeId), false)];
}

export function getAllThemes(): ThemeConfig[] {
  return THEME_IDS.map(id => themes[id]);
}

export function getLocalizedThemeName(preference: ThemePreference, language: Language): string {
  const t = getTranslations(language);
  switch (preference) {
    case 'system': return t.themeNameSystem;
    case 'light': return t.themeNameLight;
    case 'dark': return t.themeNameDark;
    case 'contrast': return t.themeNameContrast;
  }
}
