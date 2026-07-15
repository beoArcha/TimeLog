// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../src/App';
import { isDesktopEnvironment } from '@common/utils/environment';

// Mock components
vi.mock('../../src/app-browser/AppBrowser', () => ({
  default: () => <div data-testid="app-browser">AppBrowser Component</div>
}));

vi.mock('../../src/app-tauri/AppTauri', () => ({
  default: () => <div data-testid="app-tauri">AppTauri Component</div>
}));

vi.mock('@common/utils/environment', () => ({
  isDesktopEnvironment: vi.fn()
}));

describe('Unit Tests: App Runtime Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render AppBrowser when isDesktopEnvironment is false', () => {
    vi.mocked(isDesktopEnvironment).mockReturnValue(false);
    const { getByTestId, queryByTestId } = render(<App />);
    expect(getByTestId('app-browser')).not.toBeNull();
    expect(queryByTestId('app-tauri')).toBeNull();
  });

  it('should render AppTauri when isDesktopEnvironment is true', () => {
    vi.mocked(isDesktopEnvironment).mockReturnValue(true);
    const { getByTestId, queryByTestId } = render(<App />);
    expect(getByTestId('app-tauri')).not.toBeNull();
    expect(queryByTestId('app-browser')).toBeNull();
  });
});
