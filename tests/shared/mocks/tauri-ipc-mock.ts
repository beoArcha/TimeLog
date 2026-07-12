import { vi } from 'vitest';
import { act } from '@testing-library/react';
import { MockCommandArgs } from './types';
import { BACKEND_HANDLERS } from './backend-handlers';

export type TauriEventCallback = (event: { payload: unknown }) => void;

export const tauriEventRegistry: Record<string, TauriEventCallback> = {};

export const triggerTauriEvent = (eventName: string, payload?: unknown): void => {
  if (tauriEventRegistry[eventName]) {
    act(() => {
      tauriEventRegistry[eventName]({ payload });
    });
  }
};

export const mockInvoke = vi.fn().mockImplementation((cmd: string, args?: MockCommandArgs) => {
  if (cmd in BACKEND_HANDLERS) {
    return BACKEND_HANDLERS[cmd](args ?? {});
  }
  return Promise.resolve(undefined);
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (cmd: string, args?: unknown) => {
    if (args !== undefined) return mockInvoke(cmd, args as MockCommandArgs);
    return mockInvoke(cmd);
  },
}));

export const mockListen = vi.fn().mockImplementation((eventName: string, callback: TauriEventCallback) => {
  tauriEventRegistry[eventName] = callback;
  return Promise.resolve(() => {
    delete tauriEventRegistry[eventName];
  });
});

vi.mock('@tauri-apps/api/event', () => ({
  listen: (eventName: string, callback: TauriEventCallback) => mockListen(eventName, callback),
}));
