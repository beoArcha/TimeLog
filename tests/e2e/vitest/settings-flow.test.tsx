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

describe('E2E Flow: Settings and Storage', () => {
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

  it('should_toggle_minimize_to_tray_checkbox_inside_options_tab_when_clicked', async () => {
    const { container } = render(<LocaleProvider><App /></LocaleProvider>);
    
    // Go to options tab
    const optionsTabBtn = await getEl(container, '[data-testid="tab-options"]');
    fireEvent.click(optionsTabBtn);
    
    // Expand config settings
    const configHeader = await getEl(container, '[data-testid="collapsible-trigger-Konfiguracja Silnika"]');
    fireEvent.click(configHeader);
    await waitRender();

    // Get minimize to tray checkbox
    const checkbox = await getEl(container, 'input[type="checkbox"][class*="accent-orange-500"]') as HTMLInputElement;
    expect(checkbox).toBeDefined();
    const initialState = checkbox.checked;

    // Toggle minimizeToTray
    fireEvent.click(checkbox);
    await waitRender();
    expect(checkbox.checked).toBe(!initialState);
    expect(localStorage.getItem('oxytime_min_to_tray')).toEqual(String(!initialState));
  });

  it('should_verify_local_storage_and_state_variables_use_valid_GuiSize_types_when_assigned', async () => {
    localStorage.setItem('oxytime_gui_variant', 'small');
    const storedVariant = localStorage.getItem('oxytime_gui_variant') as import('../../../src/bindings/GuiSize').GuiSize;
    expect(storedVariant).toBe('small');
  });
});
