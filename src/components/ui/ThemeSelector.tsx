import { Check, Contrast, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getLocalizedThemeName } from '../../core/services/theme';
import { ThemePreference } from '../../core/types';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';

const THEME_ICONS: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
  contrast: Contrast,
};

interface ThemeSelectorProps {
  /** `sidebar`: a full-width row whose menu opens upward; `bar`: an icon button in the phone top bar. */
  variant: 'sidebar' | 'bar';
}

export default function ThemeSelector({ variant }: ThemeSelectorProps) {
  const { preference, changeTheme, preferences } = useTheme();
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const CurrentIcon = THEME_ICONS[preference];
  const currentName = getLocalizedThemeName(preference, language);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {variant === 'sidebar' ? (
        <button
          type="button"
          className="nav-item w-full"
          onClick={() => setOpen(value => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`${t.selectThemeAria}: ${currentName}`}
        >
          <CurrentIcon aria-hidden="true" />
          <span className="flex-1 text-left">{t.theme}</span>
          <span className="text-sm font-normal">{currentName}</span>
        </button>
      ) : (
        <button
          type="button"
          className="icon-button"
          onClick={() => setOpen(value => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`${t.selectThemeAria}: ${currentName}`}
          title={t.theme}
        >
          <CurrentIcon aria-hidden="true" />
        </button>
      )}

      {open && (
        <div
          role="menu"
          aria-label={t.theme}
          className={`menu absolute z-50 ${variant === 'sidebar' ? 'bottom-full left-0 mb-2 w-full' : 'right-0 top-full mt-2'}`}
        >
          {preferences.map(id => {
            const Icon = THEME_ICONS[id];
            const selected = id === preference;
            return (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className="menu-item"
                onClick={() => {
                  changeTheme(id);
                  setOpen(false);
                }}
              >
                <Icon aria-hidden="true" />
                <span className="flex-1">{getLocalizedThemeName(id, language)}</span>
                {selected && <Check aria-hidden="true" className="!text-ink" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
