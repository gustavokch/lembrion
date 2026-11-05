/**
 * Run `callback` when the browser is idle. Safari has no `requestIdleCallback`,
 * so fall back to a macrotask there.
 */
export function runWhenIdle(callback: () => void, timeout = 1000): void {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => callback(), { timeout });
    return;
  }
  setTimeout(callback, 1);
}
