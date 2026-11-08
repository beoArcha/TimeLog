// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@components/ui/dialog';
import { MockLocaleProvider } from '@tests/shared/mocks/MockProviders';
import type { Locale } from '@bindings/Locale';

describe('Dialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render dialog popup content when open is true', () => {
    // Arrange & Act
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <div>Main dialog content</div>
          <DialogFooter>
            <button type="button">Save changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Assert
    expect(screen.getByText('Edit Profile')).toBeTruthy();
    expect(screen.getByText('Update your personal information')).toBeTruthy();
    expect(screen.getByText('Main dialog content')).toBeTruthy();
    expect(screen.getByText('Save changes')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('should not render dialog popup content when open is false', () => {
    // Arrange & Act
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden Modal</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Assert
    expect(screen.queryByText('Hidden Modal')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should render default English close sr-only text and aria-label when outside LocaleProvider', () => {
    // Arrange & Act
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Default Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Assert
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('aria-label')).toBe('Close');
    const srOnly = closeBtn.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe('Close');
  });

  it.each([
    ['pl', 'Zamknij'],
    ['de', 'Schließen'],
    ['es', 'Cerrar'],
    ['fr', 'Fermer'],
    ['uk', 'Закрити'],
    ['ja', '閉じる'],
    ['pt-br', 'Fechar'],
    ['nl', 'Sluiten'],
    ['it', 'Chiudi'],
  ] as const)('should render localized close label for locale %s when wrapped in LocaleProvider', (locale, expectedLabel) => {
    // Arrange & Act
    render(
      <MockLocaleProvider value={{ locale: locale as Locale }}>
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Localized Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      </MockLocaleProvider>
    );

    // Assert
    const closeBtn = screen.getByRole('button', { name: expectedLabel });
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('aria-label')).toBe(expectedLabel);
    const srOnly = closeBtn.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe(expectedLabel);
  });

  it('should allow custom closeLabel prop override when closeLabel is provided', () => {
    // Arrange & Act
    render(
      <Dialog open={true}>
        <DialogContent closeLabel="Dismiss Dialog">
          <DialogTitle>Custom Close Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Assert
    const closeBtn = screen.getByRole('button', { name: 'Dismiss Dialog' });
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('aria-label')).toBe('Dismiss Dialog');
    const srOnly = closeBtn.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe('Dismiss Dialog');
  });

  it('should omit close button when showClose is false', () => {
    // Arrange & Act
    render(
      <Dialog open={true}>
        <DialogContent showClose={false}>
          <DialogTitle>No Close Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Assert
    expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
  });
});
