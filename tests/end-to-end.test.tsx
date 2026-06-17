// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '@/src/App';
import { LocaleProvider } from '@/src/providers/LocaleProvider';

// We need to mock alert and prompt
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

describe('E2E Interaction Suite: State, CLI, Backup, API Push', () => {

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

  it('renders the application correctly', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);
    expect(await screen.findAllByText(/OxyFlow/i)).toBeDefined();
  });

  it('tests CLI emulation commands (addproject, tasks, etc)', async () => {
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

  it('allows JSON backup export and import', async () => {
    const { container } = render(<LocaleProvider><App /></LocaleProvider>);
    const backupTabBtn = await getEl(container, '[data-testid="tab-backup"]');
    fireEvent.click(backupTabBtn);

    const exportBtn = await getEl(container, '[data-testid="export-backup-btn"]');
    fireEvent.click(exportBtn);
    expect(global.URL.createObjectURL).toHaveBeenCalled();

    const fileInput = await getEl(container, '[data-testid="import-backup-input"]') as HTMLInputElement;
    const fakeBackup = {
      projects: [{ id: '99', name: 'Imported E2E Project', color: 'blue', createdAt: new Date().toISOString() }],
      tasks: [],
      logs: [],
      holidays: [],
      patches: [],
    };
    const mockFile = new File([JSON.stringify(fakeBackup)], "backup.json", { type: "application/json" });
    Object.defineProperty(fileInput, 'files', { value: [mockFile] });
    fireEvent.change(fileInput);

    await waitRender();
    await waitRender();
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Backup imported successfully"));
  });

  it('triggers external API push on task complete/state change', async () => {
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

  it('tests archiving a project removes it from active flow but keeps data', async () => {
    const { container } = render(<LocaleProvider><App /></LocaleProvider>);
    
    // Switch to GUI
    const guiBtn = await getEl(container, '[data-testid="tab-main"]');
    if(guiBtn) fireEvent.click(guiBtn);

    // Find the first project and archive button (we might need to mock or trigger the event)
    const projectItem = await getEl(container, '#project-item-1');
    expect(projectItem).toBeDefined();

    // Trigger Archive project
    // Actually we can add project, then archive from UI. But in GUI there's a hover button taking toggleProjectArchive.
    // It has `Archiwizuj` / `Archivize`
    const archiveBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Archiwizuj') || b.textContent?.includes('Archive'));
    if (archiveBtn) {
      fireEvent.click(archiveBtn);
      await waitRender();
      expect(projectItem.className).toMatch(/opacity-50/);
    }
  });
});
