import { vi } from 'vitest';

declare global {
  interface Window {
    __TAURI_INTERNALS__?: Record<string, unknown>;
  }
}

export const setTauriDesktopEnvironment = (active = true): void => {
  if (active) {
    window.__TAURI_INTERNALS__ = {};
  } else {
    delete window.__TAURI_INTERNALS__;
  }
};

export const setupWindowLocationMock = () => {
  const originalLocation = window.location;
  const reloadMock = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, reload: reloadMock },
  });
  return {
    reloadMock,
    restore: () => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    },
  };
};

export const setupLocalStorageMock = (): Record<string, string> => {
  const store: Record<string, string> = {};

  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] || null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
    store[key] = value;
  });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
    delete store[key];
  });
  vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
    for (const key in store) {
      delete store[key];
    }
  });

  if (typeof crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => ('mocked-uuid-' + Math.random().toString(36).substring(2, 9)) as `${string}-${string}-${string}-${string}-${string}`
      }
    });
  } else if (!crypto.randomUUID) {
    crypto.randomUUID = () => ('mocked-uuid-' + Math.random().toString(36).substring(2, 9)) as `${string}-${string}-${string}-${string}-${string}`;
  }

  return store;
};

export const setupMatchMediaMock = (matches = false): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};
