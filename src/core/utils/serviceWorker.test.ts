import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupServiceWorker } from './serviceWorker';

function installServiceWorkerMock() {
  const unregister = vi.fn().mockResolvedValue(true);
  const container = {
    register: vi.fn().mockResolvedValue({}),
    getRegistrations: vi.fn().mockResolvedValue([{ unregister }, { unregister }]),
  };
  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
  return { container, unregister };
}

async function fireLoadAndIdle() {
  window.dispatchEvent(new Event('load'));
  await vi.runAllTimersAsync();
}

describe('setupServiceWorker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('registers /sw.js after load in a production build on a real host', async () => {
    const { container } = installServiceWorkerMock();

    setupServiceWorker(true, 'studorama.vercel.app');
    expect(container.register).not.toHaveBeenCalled();

    await fireLoadAndIdle();
    expect(container.register).toHaveBeenCalledWith('/sw.js');
    expect(container.getRegistrations).not.toHaveBeenCalled();
  });

  it('does not register in development and unregisters leftover workers', async () => {
    const { container, unregister } = installServiceWorkerMock();

    setupServiceWorker(false, 'studorama.vercel.app');
    await fireLoadAndIdle();

    expect(container.register).not.toHaveBeenCalled();
    expect(unregister).toHaveBeenCalledTimes(2);
  });

  it.each(['localhost', '127.0.0.1'])('does not register a production build served from %s', async (hostname) => {
    const { container, unregister } = installServiceWorkerMock();

    setupServiceWorker(true, hostname);
    await fireLoadAndIdle();

    expect(container.register).not.toHaveBeenCalled();
    expect(unregister).toHaveBeenCalledTimes(2);
  });
});
