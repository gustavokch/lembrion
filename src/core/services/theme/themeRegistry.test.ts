import { describe, it, expect } from 'vitest';
import { getAllThemes } from './themeRegistry';

// jsdom does not validate CSS values, so check the grammar of the two
// properties the effect tokens feed: `backdrop-filter` and `transition`.
const BACKDROP_FILTER = /^(none|blur\(\d+(\.\d+)?px\))$/;
const TIMING_FUNCTIONS = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'];

function isTransitionValue(value: string): boolean {
  const [property, duration, timing, ...rest] = value.split(' ');
  return (
    rest.length === 0 &&
    /^[a-z-]+$/.test(property) &&
    /^\d+m?s$/.test(duration) &&
    TIMING_FUNCTIONS.includes(timing)
  );
}

describe('theme effects', () => {
  const themes = getAllThemes();

  it('covers every theme', () => {
    expect(themes).toHaveLength(10);
  });

  it.each(themes.map((theme) => [theme.id, theme.effects] as const))(
    '%s uses CSS values, not Tailwind class names',
    (_id, effects) => {
      expect(effects.blur).toMatch(BACKDROP_FILTER);
      expect(isTransitionValue(effects.animation)).toBe(true);
    },
  );
});
