import { describe, it, expect } from 'vitest';
import { Theme } from '../../types';
import { getAllThemes, getTheme, resolveThemePreference, themeForPreference } from './themeRegistry';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('resolveThemePreference', () => {
  it('keeps current preference ids', () => {
    for (const id of ['system', 'light', 'dark', 'contrast']) {
      expect(resolveThemePreference(id)).toBe(id);
    }
  });

  it('maps retired dark themes to dark and any other string to light', () => {
    expect(resolveThemePreference('midnight')).toBe('dark');
    expect(resolveThemePreference('neon')).toBe('dark');
    for (const id of ['focus', 'forest', 'ocean', 'sunset', 'minimal', 'warm', 'constructor', '']) {
      expect(resolveThemePreference(id)).toBe('light');
    }
  });

  it('falls back to the dark default for missing or non-string values', () => {
    expect(resolveThemePreference(undefined)).toBe('dark');
    expect(resolveThemePreference(null)).toBe('dark');
    expect(resolveThemePreference(42)).toBe('dark');
    expect(resolveThemePreference({ id: 'light' })).toBe('dark');
  });
});

describe('themeForPreference', () => {
  it('resolves system by the colour-scheme flag', () => {
    expect(themeForPreference('system', true)).toBe('dark');
    expect(themeForPreference('system', false)).toBe('light');
  });

  it('keeps an explicit palette whatever the flag', () => {
    for (const prefersDark of [true, false]) {
      expect(themeForPreference('light', prefersDark)).toBe('light');
      expect(themeForPreference('dark', prefersDark)).toBe('dark');
      expect(themeForPreference('contrast', prefersDark)).toBe('contrast');
    }
  });
});

describe('getTheme', () => {
  it('returns a palette for an unknown id instead of throwing', () => {
    expect(getTheme('constructor' as Theme).id).toBe('light');
    expect(getTheme('system' as Theme).id).toBe('light');
    expect(getTheme(undefined as unknown as Theme).id).toBe('dark');
    expect(getTheme('midnight' as Theme).id).toBe('dark');
  });
});

describe('theme contrast', () => {
  it.each(getAllThemes().map(theme => [theme.id, theme.colors] as const))('%s meets WCAG AA', (_id, c) => {
    for (const ground of [c.ground, c.surface, c.sunken]) {
      expect(contrast(c.ink, ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.inkSoft, ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.inkMuted, ground)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(c.accentInk, c.ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.successInk, c.ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.errorInk, c.ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.warningInk, c.ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.shellInk, c.shell)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.shellMuted, c.shell)).toBeGreaterThanOrEqual(4.5);
    // Form-control borders and the focus ring are non-text UI (3:1).
    expect(contrast(c.lineStrong, c.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.focus, c.ground)).toBeGreaterThanOrEqual(3);
    expect(contrast(c.accent, c.shell)).toBeGreaterThanOrEqual(3);
  });
});
