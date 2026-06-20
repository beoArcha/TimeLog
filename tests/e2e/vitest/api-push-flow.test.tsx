// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import App from '../../../src/App';
import { LocaleProvider } from '../../../src/providers/LocaleProvider';

window.alert = vi.fn();
window.prompt = vi.fn();
global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ ok: true }) } as any));
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLAnchorElement.prototype.click = vi.fn();

describe('E2E Flow: API Push Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  const waitRender = () => new Promise(r => setTimeout(r, 50));
  
  const getEl = async (container: HTMLElement, selector: string) => {
    for (let i = 0; i < 20; i++) {
      const el = container.querySelector(selector);
      if (el) return el as HTMLElement;
      await waitRender();
    }
    throw new Error(`Element not found: ${selector}`);
  };

  it('should_trigger_external_API_push_on_task_complete_or_state_change', async () => {
     const { container } = render(<LocaleProvider><App /></LocaleProvider>);
     
     const backupTabBtn = await getEl(container, '[data-testid="tab-backup"]');
     fireEvent.click(backupTabBtn);
     
     const apiPushCollapseHeader = await getEl(container, '[data-testid="api-push-collapse-header"]');
     fireEvent.click(apiPushCollapseHeader);
     
     const apiToggle = await getEl(container, '[data-testid="api-push-toggle"]') as HTMLInputElement;
     fireEvent.click(apiToggle);
     
     const apiUrlInput = await getEl(container, '[data-testid="api-url-input"]') as HTMLInputElement;
     fireEvent.change(apiUrlInput, { target: { value: 'https://test-server.com/logs' } });
     
     const apiTokenInput = await getEl(container, '[data-testid="api-token-input"]') as HTMLInputElement;
     fireEvent.change(apiTokenInput, { target: { value: 'secrettoken_123' } });

     const cliTabBtn = await getEl(container, '[data-testid="tab-cli"]');
     fireEvent.click(cliTabBtn);
     
     const input = await getEl(container, '#cli-input-field') as HTMLInputElement;
     const submitBtn = await getEl(container, '#cli-submit-btn');
     
     fireEvent.change(input, { target: { value: 'addproject "PushProj"' } });
     fireEvent.click(submitBtn);
     fireEvent.change(input, { target: { value: 'addtask 1 "PushTask"' } });
     fireEvent.click(submitBtn);
     
     vi.clearAllMocks();
     fireEvent.change(input, { target: { value: 'start 102' } });
     fireEvent.click(submitBtn);

     await waitRender();
     await waitRender();
     
     expect(global.fetch).toHaveBeenCalledWith('https://test-server.com/logs', expect.objectContaining({
       method: 'POST',
       headers: expect.objectContaining({ 'Authorization': 'Bearer secrettoken_123' })
     }));
     
     vi.clearAllMocks();
     fireEvent.change(input, { target: { value: 'stop' } });
     fireEvent.click(submitBtn);
     
     await waitRender();
     await waitRender();
     expect(global.fetch).toHaveBeenCalledWith('https://test-server.com/logs', expect.objectContaining({
       method: 'POST',
       headers: expect.objectContaining({ 'Authorization': 'Bearer secrettoken_123' })
     }));
  });
});
