import { describe, it, expect } from 'vitest';
import { getAllThemes, resolveTheme } from './themeRegistry';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('resolveTheme', () => {
  it('keeps current theme ids', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('contrast')).toBe('contrast');
  });

  it('maps retired dark themes to dark and the rest to light', () => {
    expect(resolveTheme('midnight')).toBe('dark');
    expect(resolveTheme('neon')).toBe('dark');
    for (const id of ['focus', 'forest', 'ocean', 'sunset', 'minimal', 'warm']) {
      expect(resolveTheme(id)).toBe('light');
    }
  });

  it('falls back to light for missing or corrupted values', () => {
    expect(resolveTheme(undefined)).toBe('light');
    expect(resolveTheme(42)).toBe('light');
    expect(resolveTheme('constructor')).toBe('light');
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
