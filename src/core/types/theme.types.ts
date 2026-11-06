/** Concrete palettes. */
export const THEME_IDS = ['light', 'dark', 'contrast'] as const;

export type Theme = (typeof THEME_IDS)[number];

/** Stored choice: a palette, or `system` to follow `prefers-color-scheme`. */
export const THEME_PREFERENCE_IDS = ['system', ...THEME_IDS] as const;

export type ThemePreference = (typeof THEME_PREFERENCE_IDS)[number];

/**
 * Colour tokens. `useTheme()` writes each one to `--color-<key>` on
 * `<html>`; Tailwind maps them to semantic classes (`bg-shell`, `text-ink`).
 * Every value is a 6-digit hex.
 */
export interface ThemeColors {
  /** Ground of the sidebar, the phone top bar and its menu. */
  shell: string;
  /** Text on the shell. */
  shellInk: string;
  /** Secondary text on the shell (nav items at rest). */
  shellMuted: string;
  /** Page ground. */
  ground: string;
  /** Inputs, tables, raised regions. */
  surface: string;
  /** Block bodies, hover fills, inset regions. */
  sunken: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  /** Hairline separators. */
  line: string;
  /** Form-control borders (3:1 against surface). */
  lineStrong: string;
  /** Primary button fill. */
  primary: string;
  primaryHover: string;
  onPrimary: string;
  /** Progress and the current item only. */
  accent: string;
  /** Accent as text on the ground (4.5:1). */
  accentInk: string;
  success: string;
  successInk: string;
  error: string;
  errorInk: string;
  warning: string;
  warningInk: string;
  /** Focus ring on the ground. */
  focus: string;
}

export interface ThemeConfig {
  id: Theme;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
}
