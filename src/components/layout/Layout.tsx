import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, History, LayoutGrid, LifeBuoy, Menu, SlidersHorizontal, X, type LucideIcon } from 'lucide-react';
import { useLanguage, useTheme } from '../../hooks';
import BrandMark from '../ui/BrandMark';
import ThemeSelector from '../ui/ThemeSelector';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavEntry {
  path: string;
  label: string;
  icon: LucideIcon;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { t } = useLanguage();
  // Mounted on every route, so this instance applies the stored theme.
  useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const navItems: NavEntry[] = [
    { path: '/', label: t.dashboard, icon: LayoutGrid },
    { path: '/study', label: t.study, icon: BookOpen },
    { path: '/history', label: t.history, icon: History },
    { path: '/settings', label: t.settings, icon: SlidersHorizontal },
  ];
  const supportItem: NavEntry = { path: '/pricing', label: t.supportUs, icon: LifeBuoy };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLink = ({ path, label, icon: Icon }: NavEntry) => (
    <Link
      to={path}
      aria-current={isActive(path) ? 'page' : undefined}
      className={`nav-item ${isActive(path) ? 'is-active' : ''}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[14.5rem_minmax(0,1fr)]">
      <a href="#main-content" className="skip-link">
        {t.skipToContent}
      </a>

      {/* From 1024px: the sidebar */}
      <aside className="sidebar">
        <Link to="/" className="wordmark px-2.5">
          <BrandMark className="wordmark-mark" />
          lembrion
        </Link>
        <nav aria-label={t.mainNavigation} className="mt-8">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.path}>{navLink(item)}</li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto space-y-1 border-t border-line pt-3">
          {navLink(supportItem)}
          <ThemeSelector variant="sidebar" />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Below 1024px: a top bar with the menu */}
        <header className="sticky top-0 z-40 lg:hidden">
          <div className="topbar">
            <Link to="/" className="wordmark text-xl">
              <BrandMark className="wordmark-mark" />
              lembrion
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <ThemeSelector variant="bar" />
              <button
                type="button"
                className="icon-button"
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
            <nav id="mobile-menu" aria-label={t.mainNavigation} className="border-b border-line bg-shell px-3 py-2">
              <ul className="space-y-1">
                {[...navItems, supportItem].map(item => (
                  <li key={item.path}>{navLink(item)}</li>
                ))}
              </ul>
            </nav>
          )}
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 outline-none safe-bottom">
          {children}
        </main>
      </div>
    </div>
  );
}
