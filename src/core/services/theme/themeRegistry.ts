import { Language, Theme, ThemeConfig, ThemePreference, THEME_IDS, THEME_PREFERENCE_IDS } from '../../types';
import { getTranslations } from '../i18n/translations';

export const themes: Record<Theme, ThemeConfig> = {
  light: {
    id: 'light',
    scheme: 'light',
    colors: {
      shell: '#ffffff',
      shellInk: '#1c1f2a',
      shellMuted: '#5d6170',
      ground: '#f7f7f8',
      surface: '#ffffff',
      sunken: '#f1f1f4',
      ink: '#1c1f2a',
      inkSoft: '#3d4150',
      inkMuted: '#5d6170',
      line: '#e3e3e8',
      lineStrong: '#8b8e9e',
      primary: '#4b33b5',
      primaryHover: '#3e289c',
      onPrimary: '#ffffff',
      accent: '#4b33b5',
      accentInk: '#4b33b5',
      success: '#1f8a4c',
      successInk: '#17703d',
      error: '#c8323a',
      errorInk: '#b8262f',
      warning: '#c98a0b',
      warningInk: '#8a5a00',
      focus: '#4b33b5',
    },
  },

  dark: {
    id: 'dark',
    scheme: 'dark',
    colors: {
      shell: '#0c0c0c',
      shellInk: '#ececec',
      shellMuted: '#a3a3a3',
      ground: '#121212',
      surface: '#181818',
      sunken: '#202020',
      ink: '#ececec',
      inkSoft: '#c8c8c8',
      inkMuted: '#a3a3a3',
      line: '#2a2a2a',
      lineStrong: '#6b6b6b',
      primary: '#5b43d6',
      primaryHover: '#6a54e6',
      onPrimary: '#ffffff',
      accent: '#9d8cff',
      accentInk: '#9d8cff',
      success: '#3fbf74',
      successInk: '#6fd896',
      error: '#ff6b5f',
      errorInk: '#ff6b5f',
      warning: '#e0a526',
      warningInk: '#f0c060',
      focus: '#9d8cff',
    },
  },

  contrast: {
    id: 'contrast',
    scheme: 'light',
    colors: {
      shell: '#ffffff',
      shellInk: '#000000',
      shellMuted: '#2b2b33',
      ground: '#ffffff',
      surface: '#ffffff',
      sunken: '#f0f0f2',
      ink: '#000000',
      inkSoft: '#1f1f26',
      inkMuted: '#3a3a44',
      line: '#8a8a96',
      lineStrong: '#4a4a55',
      primary: '#2a1690',
      primaryHover: '#3a24a8',
      onPrimary: '#ffffff',
      accent: '#2a1690',
      accentInk: '#2a1690',
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
 * or non-string value gets the default, `dark`.
 */
export function resolveThemePreference(value: unknown): ThemePreference {
  if (typeof value !== 'string') return 'dark';
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
