import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SystemNotification from '@components/SystemNotification';
import RestoreButton from '@components/RestoreButton';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Unit Tests: SystemNotification & RestoreButton', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('SystemNotification', () => {
    it('Given trayNotification is null, When rendered, Then it should not show notification', () => {
      const mockState = getMockOxyFlowState();
      const stateProp = {
        ...mockState,
        trayNotification: null,
      } as unknown as any;

      render(
        <MockProviders state={stateProp}>
          <SystemNotification />
        </MockProviders>
      );

      expect(screen.queryByText(/System Notification Tray/i)).toBeNull();
    });

    it('Given trayNotification exists, When rendered, Then it should show notification and call setTrayNotification on close click', () => {
      const mockState = getMockOxyFlowState();
      const setTrayNotificationSpy = vi.fn();
      const stateProp = {
        ...mockState,
        trayNotification: 'Engine started successfully',
        setTrayNotification: setTrayNotificationSpy,
      } as unknown as any;

      render(
        <MockProviders state={stateProp}>
          <SystemNotification />
        </MockProviders>
      );

      expect(screen.getByText('Engine started successfully')).toBeTruthy();

      const closeBtn = screen.getByRole('button');
      fireEvent.click(closeBtn);

      expect(setTrayNotificationSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('RestoreButton', () => {
    it('Given RestoreButton rendered, When clicked, Then it should call setIsMinimized and showToast', () => {
      const mockState = getMockOxyFlowState();
      const setIsMinimizedSpy = vi.fn();
      const showToastSpy = vi.fn();

      render(
        <MockProviders state={mockState}>
          <RestoreButton setIsMinimized={setIsMinimizedSpy} showToast={showToastSpy} />
        </MockProviders>
      );

      const restoreBtn = screen.getByRole('button');
      fireEvent.click(restoreBtn);

      expect(setIsMinimizedSpy).toHaveBeenCalledWith(false);
      expect(showToastSpy).toHaveBeenCalled();
    });
  });
});
