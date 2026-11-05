/**
 * Development-only logging. Prompts and raw model output must not reach production consoles.
 */
export function debugLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
}
