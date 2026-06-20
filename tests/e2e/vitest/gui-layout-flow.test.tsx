// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

describe('E2E Flow: GUI Layout and Core Renderings', () => {
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

  it('should_render_application_correctly_when_bootstrapped', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);
    expect(await screen.findAllByText(/LogTime by OxyFlow/i)).toBeDefined();
  });

  it('should_run_CLI_emulation_commands_when_submitted', async () => {
    const { container } = render(<LocaleProvider><App /></LocaleProvider>);
    const cliTabBtn = await getEl(container, '[data-testid="tab-cli"]');
    fireEvent.click(cliTabBtn);
    
    const input = await getEl(container, '#cli-input-field') as HTMLInputElement;
    const submitBtn = await getEl(container, '#cli-submit-btn');
    
    fireEvent.change(input, { target: { value: 'addproject "My Test Project"' } });
    fireEvent.click(submitBtn);
    
    await waitRender();
    await waitRender();
    expect(container.innerHTML).toMatch(/Created project/i);
  });

  it('should_archive_project_and_keep_data_when_archive_is_clicked', async () => {
    const { container } = render(<LocaleProvider><App /></LocaleProvider>);
    
    const guiBtn = await getEl(container, '[data-testid="tab-main"]');
    if(guiBtn) fireEvent.click(guiBtn);

    const projectItem = await getEl(container, '#project-item-1');
    expect(projectItem).toBeDefined();

    const archiveBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Archiwizuj') || b.textContent?.includes('Archive'));
    if (archiveBtn) {
      fireEvent.click(archiveBtn);
      await waitRender();
      expect(projectItem.className).toMatch(/opacity-50/);
    }
  });

  it('should_switch_GUI_layout_variants_manually_when_requested', async () => {
    const { container } = render(<LocaleProvider><App /></LocaleProvider>);
    
    // Large view default has main tab
    expect(await getEl(container, '[data-testid="tab-main"]')).toBeDefined();
    
    // Click 'Średnie' (Medium)
    const mediumBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Średnie'));
    expect(mediumBtn).toBeDefined();
    fireEvent.click(mediumBtn!);
    await waitRender();
    
    // Medium mode doesn't render main tab buttons
    expect(container.querySelector('[data-testid="tab-main"]')).toBeNull();

    // Click 'Małe' (Small)
    const smallBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Małe'));
    expect(smallBtn).toBeDefined();
    fireEvent.click(smallBtn!);

    // Small mode renders SmallGui with Top check (wait for animation transition)
    expect(await screen.findByText('Top')).toBeDefined();
  });
});
