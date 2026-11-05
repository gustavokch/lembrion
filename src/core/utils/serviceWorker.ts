import { runWhenIdle } from './idle';

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

/**
 * Register `/sw.js` only for production builds served from a real host.
 * Everywhere else (dev server, local preview) unregister leftover workers,
 * because a worker from an earlier session keeps serving stale assets.
 */
export function setupServiceWorker(isProduction: boolean, hostname: string): void {
  if (!('serviceWorker' in navigator)) return;

  if (isProduction && !LOCAL_HOSTNAMES.includes(hostname)) {
    window.addEventListener('load', () => {
      runWhenIdle(() => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.error('Service worker registration failed:', error);
        });
      });
    }, { once: true });
    return;
  }

  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch((error) => {
      console.error('Service worker cleanup failed:', error);
    });
}
