import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage, useTheme } from '../../hooks';
import ThemeSelector from '../ui/ThemeSelector';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { t } = useLanguage();
  // Mounted on every route, so this instance applies the stored theme.
  useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: t.dashboard },
    { path: '/study', label: t.study },
    { path: '/history', label: t.history },
    { path: '/settings', label: t.settings },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        {t.skipToContent}
      </a>

      <header className="on-shell sticky top-0 z-40 bg-shell text-shell-ink">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-4 sm:px-6 lg:px-10">
          <Link to="/" className="text-lg font-medium tracking-[0.01em] text-shell-ink no-underline">
            Lembrion
          </Link>

          <nav aria-label={t.mainNavigation} className="hidden h-full md:block">
            <ul className="flex h-full items-stretch gap-7">
              {navItems.map(({ path, label }) => (
                <li key={path} className="flex">
                  <Link
                    to={path}
                    aria-current={isActive(path) ? 'page' : undefined}
                    className={`shell-link ${isActive(path) ? 'is-active' : ''}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 self-stretch">
            <Link
              to="/pricing"
              aria-current={isActive('/pricing') ? 'page' : undefined}
              className={`shell-link mr-3 hidden self-stretch text-sm md:flex ${isActive('/pricing') ? 'is-active' : ''}`}
            >
              {t.supportUs}
            </Link>
            <ThemeSelector />
            <button
              type="button"
              className="shell-icon-button md:hidden"
              onClick={() => setMenuOpen(open => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t.closeMenu : t.openMenu}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" aria-label={t.mainNavigation} className="border-t border-white/10 md:hidden">
            <ul className="mx-auto max-w-6xl px-2 py-2">
              {[...navItems, { path: '/pricing', label: t.supportUs }].map(({ path, label }) => (
                <li key={path}>
                  <Link
                    to={path}
                    aria-current={isActive(path) ? 'page' : undefined}
                    className={`shell-menu-link ${isActive(path) ? 'is-active' : ''}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none safe-bottom">
        {children}
      </main>
    </div>
  );
}
