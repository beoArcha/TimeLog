import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TrayWidgetView from '@features/tray/TrayWidgetView';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: TrayWidgetView', () => {
  const onRestoreMock = vi.fn();
  const onStopAllMock = vi.fn();

  const mockState: any = {
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
});
