import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TrayWidgetView from '@features/tray/TrayWidgetView';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: TrayWidgetView', () => {
  afterEach(() => {
    cleanup();
  });
  const onRestoreMock = vi.fn();
  const onStopAllMock = vi.fn();

  const mockState: OxyFlowState = {
    ...getMockOxyFlowState(),
    locale: 'en',
    customTranslations: {},
    resolvedTheme: 'dark',
    logs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: null, note: null, editHistory: null }
    ]
  };

  it('should render active background view and trigger callbacks', () => {
    render(
      <MockProviders state={mockState}>
        <TrayWidgetView
          onRestore={onRestoreMock}
          onStopAll={onStopAllMock}
          showToast={vi.fn()}
        />
      </MockProviders>
    );

    expect(screen.getByText(/OxyFlow Engine/i)).not.toBeNull();

    const restoreBtn = screen.getByRole('button', { name: /Restore GUI/i });
    fireEvent.click(restoreBtn);

    expect(onRestoreMock).toHaveBeenCalled();
  });

  it('should preserve custom HEX colors and resolve palette classes without fallback to rose', () => {
    const customState: OxyFlowState = {
      ...mockState,
      projects: [
        { id: 'p-hex', name: 'Hex Project', color: '#0ea5e9', archived: false, createdAt: '2026-01-01' },
        { id: 'p-palette', name: 'Palette Project', color: 'teal', archived: false, createdAt: '2026-01-01' },
      ],
      tasks: [
        { id: 't-hex', projectId: 'p-hex', name: 'Task Hex', completed: false, status: 'InProgress', createdAt: '2026-01-01' },
        { id: 't-pal', projectId: 'p-palette', name: 'Task Palette', completed: false, status: 'InProgress', createdAt: '2026-01-01' },
      ],
      logs: [
        { id: 'log-hex', taskId: 't-hex', projectId: 'p-hex', startTime: '2026-06-15T12:00:00Z', endTime: null, note: null, editHistory: null },
        { id: 'log-pal', taskId: 't-pal', projectId: 'p-palette', startTime: '2026-06-15T12:00:00Z', endTime: null, note: null, editHistory: null },
      ],
    };

    render(
      <MockProviders state={customState}>
        <TrayWidgetView
          onRestore={onRestoreMock}
          onStopAll={onStopAllMock}
          showToast={vi.fn()}
        />
      </MockProviders>
    );

    // Verify HEX project color dot
    const hexDot = screen.getByTestId('tray-project-color-log-hex');
    expect(hexDot).toBeDefined();
    expect(hexDot.style.backgroundColor).toBe('rgb(14, 165, 233)'); // #0ea5e9 in rgb
    expect(hexDot.className).not.toContain('bg-rose-500');

    // Verify palette project color dot
    const palDot = screen.getByTestId('tray-project-color-log-pal');
    expect(palDot).toBeDefined();
    expect(palDot.className).toContain('bg-teal-500');
  });

  it.each(['dark', 'light', 'high-contrast'] as const)(
    'should render tray-restore-btn with semantic default variant and without gradient in %s theme',
    (theme) => {
      const themeState: OxyFlowState = {
        ...mockState,
        resolvedTheme: theme,
      };

      render(
        <MockProviders state={themeState}>
          <TrayWidgetView
            onRestore={onRestoreMock}
            onStopAll={onStopAllMock}
            showToast={vi.fn()}
          />
        </MockProviders>
      );

      const restoreBtn = screen.getByRole('button', { name: /Restore GUI/i });
      expect(restoreBtn).toBeDefined();
      expect(restoreBtn.className).toContain('bg-primary');
      expect(restoreBtn.className).toContain('text-primary-foreground');
      expect(restoreBtn.className).not.toContain('bg-gradient-to-tr');
      expect(restoreBtn.className).not.toContain('from-orange-400');
    }
  );
});
