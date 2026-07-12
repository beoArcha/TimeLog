import { vi } from 'vitest';

// Environment Mock
vi.mock('@common/utils/environment', () => ({
  isDesktopEnvironment: vi.fn(() => true)
}));

export * from './mocks/types';
export * from './mocks/browser-mocks';
export * from './mocks/backend-handlers';
export * from './mocks/tauri-ipc-mock';
export * from './mocks/oxy-state-mock';
