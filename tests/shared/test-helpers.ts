import { vi } from 'vitest';

// Storage Mock
export const setupLocalStorageMock = () => {
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
  return store;
};

// MatchMedia Mock
export const setupMatchMediaMock = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(query => ({
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

import { act } from '@testing-library/react';

export const tauriEventRegistry: Record<string, Function> = {};

export const triggerTauriEvent = (eventName: string, payload?: any) => {
  if (tauriEventRegistry[eventName]) {
    act(() => {
      tauriEventRegistry[eventName]({ payload });
    });
  }
};

export const mockInvoke = vi.fn().mockResolvedValue(undefined);

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (cmd: string, args?: any) => {
    if (args !== undefined) return mockInvoke(cmd, args);
    return mockInvoke(cmd);
  },
}));

export const mockListen = vi.fn().mockImplementation((eventName: string, callback: Function) => {
  tauriEventRegistry[eventName] = callback;
  return Promise.resolve(() => {
    delete tauriEventRegistry[eventName];
  });
});

vi.mock('@tauri-apps/api/event', () => ({
  listen: (eventName: string, callback: Function) => mockListen(eventName, callback),
}));
