/** @type {import('tailwindcss').Config} */

// Semantic colours read the `--color-*` tokens that `useTheme()` writes,
// so every class follows the active theme. Tints use `color-mix()` in
// src/index.css; these classes take no `/opacity` modifier.
const token = (name) => `var(--color-${name})`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        shell: { DEFAULT: token('shell'), ink: token('shellInk'), muted: token('shellMuted') },
        ground: token('ground'),
        surface: token('surface'),
        sunken: token('sunken'),
        ink: { DEFAULT: token('ink'), soft: token('inkSoft'), muted: token('inkMuted') },
        line: { DEFAULT: token('line'), strong: token('lineStrong') },
        primary: { DEFAULT: token('primary'), hover: token('primaryHover'), ink: token('onPrimary') },
        accent: { DEFAULT: token('accent'), ink: token('accentInk') },
        success: { DEFAULT: token('success'), ink: token('successInk') },
        error: { DEFAULT: token('error'), ink: token('errorInk') },
        warning: { DEFAULT: token('warning'), ink: token('warningInk') },
      },
      fontFamily: {
        sans: ['"Libre Franklin"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        narrow: ['"Archivo Narrow"', '"Arial Narrow"', '"Libre Franklin"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        measure: '68ch',
      },
    },
  },
  plugins: [],
};
