// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OxyContext } from '@common/hooks/OxyContext';
import { ErrorHandler, ContextException, PersistenceException } from '@common/exceptions';
import SystemNotification from '@components/SystemNotification';
import { getMockOxyFlowState } from '@tests/shared/mocks/oxy-state-mock';

describe('Integration Tests: Error Handling and Notifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('ErrorHandler Logging Behavior', () => {
    it('Given ContextException, When ErrorHandler handles it, Then it should call console.error with FATAL log prefix', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const ex = new ContextException('State corrupted', 'ERR_CONTEXT_MIGRATION', new Error('Underlying DB error'));

      ErrorHandler.handle(ex);

      expect(errorSpy).toHaveBeenCalled();
      const firstArg = errorSpy.mock.calls[0][0];
      expect(firstArg).toContain('[FATAL]');
      expect(firstArg).toContain('[ERR_CONTEXT_MIGRATION]');
    });

    it('Given PersistenceException with WARN level, When ErrorHandler handles it, Then it should call console.warn', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
      const ex = new PersistenceException('Disk full warning', undefined, 'ERR_DISK_WARN', 'WARN');

      ErrorHandler.handle(ex);

      expect(warnSpy).toHaveBeenCalled();
      const firstArg = warnSpy.mock.calls[0][0];
      expect(firstArg).toContain('[WARN]');
      expect(firstArg).toContain('[ERR_DISK_WARN]');
    });

    it('Given PersistenceException with INFO level, When ErrorHandler handles it, Then it should call console.info', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
      const ex = new PersistenceException('Database sync started', undefined, 'ERR_SYNC_INFO', 'INFO');

      ErrorHandler.handle(ex);

      expect(infoSpy).toHaveBeenCalled();
      const firstArg = infoSpy.mock.calls[0][0];
      expect(firstArg).toContain('[INFO]');
      expect(firstArg).toContain('[ERR_SYNC_INFO]');
    });

    it('Given standard JS Error, When ErrorHandler handles it, Then it should log as UNHANDLED ERROR', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const err = new Error('Generic failure');

      ErrorHandler.handle(err);

      expect(errorSpy).toHaveBeenCalledWith('[UNHANDLED ERROR]', 'Generic failure', err);
    });

    it('Given primitive or unknown object, When ErrorHandler handles it, Then it should log as UNKNOWN ERROR', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      ErrorHandler.handle('Weird string error');

      expect(errorSpy).toHaveBeenCalledWith('[UNKNOWN ERROR]', 'Weird string error');
    });
  });

  describe('SystemNotification UI Integration', () => {
    it('Given trayNotification is null, When SystemNotification is rendered, Then it should render nothing in the DOM', () => {
      const mockState = getMockOxyFlowState();
      mockState.trayNotification = null;
      mockState.setTrayNotification = vi.fn();

      const { container } = render(
        <OxyContext.Provider value={mockState}>
          <SystemNotification />
        </OxyContext.Provider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('Given active trayNotification, When SystemNotification is rendered, Then it displays notification text and handles close click', () => {
      const mockState = getMockOxyFlowState();
      mockState.trayNotification = 'Sync complete!';
      mockState.setTrayNotification = vi.fn();
      mockState.resolvedTheme = 'dark';

      render(
        <OxyContext.Provider value={mockState}>
          <SystemNotification />
        </OxyContext.Provider>
      );

      // Verify text
      expect(screen.getByText('Sync complete!')).toBeDefined();
      expect(screen.getByText('System Notification Tray')).toBeDefined();

      const closeBtn = screen.getByRole('button');
      fireEvent.click(closeBtn);

      expect(mockState.setTrayNotification).toHaveBeenCalledWith(null);
    });

    it('Given light theme, When SystemNotification is rendered, Then it applies light theme color classes', () => {
      const mockState = getMockOxyFlowState();
      mockState.trayNotification = 'Alert message';
      mockState.setTrayNotification = vi.fn();
      mockState.resolvedTheme = 'light';

      render(
        <OxyContext.Provider value={mockState}>
          <SystemNotification />
        </OxyContext.Provider>
      );

      const notificationDiv = screen.getByText('Alert message').closest('#tray-toast-notification');
      expect(notificationDiv).not.toBeNull();
      expect(notificationDiv?.className).toContain('bg-[#FCFAF8]/95');
      expect(notificationDiv?.className).toContain('text-[#2C2421]');
    });

    it('Given high-contrast theme, When SystemNotification is rendered, Then it applies high-contrast color classes', () => {
      const mockState = getMockOxyFlowState();
      mockState.trayNotification = 'Alert message';
      mockState.setTrayNotification = vi.fn();
      mockState.resolvedTheme = 'high-contrast';

      render(
        <OxyContext.Provider value={mockState}>
          <SystemNotification />
        </OxyContext.Provider>
      );

      const notificationDiv = screen.getByText('Alert message').closest('#tray-toast-notification');
      expect(notificationDiv).not.toBeNull();
      expect(notificationDiv?.className).toContain('bg-black');
      expect(notificationDiv?.className).toContain('border-white');
    });
  });
});
