// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@components/ui/drawer';
import { MockLocaleProvider } from '@tests/shared/mocks/MockProviders';
import type { Locale } from '@bindings/Locale';

describe('Drawer', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render drawer dialog content when open is true', () => {
    // Arrange & Act
    render(
      <Drawer open={true}>
        <DrawerContent side="right">
          <DrawerHeader>
            <DrawerTitle>Navigation Drawer</DrawerTitle>
            <DrawerDescription>Drawer subtitle</DrawerDescription>
          </DrawerHeader>
          <div>Drawer main body</div>
          <DrawerFooter>
            <span>Footer text</span>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );

    // Assert
    expect(screen.getByText('Navigation Drawer')).toBeTruthy();
    expect(screen.getByText('Drawer subtitle')).toBeTruthy();
    expect(screen.getByText('Drawer main body')).toBeTruthy();
    expect(screen.getByText('Footer text')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('should not render drawer popup when open is false', () => {
    // Arrange & Act
    render(
      <Drawer open={false}>
        <DrawerContent>
          <DrawerTitle>Hidden title</DrawerTitle>
        </DrawerContent>
      </Drawer>
    );

    // Assert
    expect(screen.queryByText('Hidden title')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it.each([
    ['top', 'data-[starting-style]:-translate-y-full', 'data-[ending-style]:-translate-y-full'],
    ['bottom', 'data-[starting-style]:translate-y-full', 'data-[ending-style]:translate-y-full'],
    ['left', 'data-[starting-style]:-translate-x-full', 'data-[ending-style]:-translate-x-full'],
    ['right', 'data-[starting-style]:translate-x-full', 'data-[ending-style]:translate-x-full'],
  ] as const)('should apply correct transition classes for side %s', (side, startingClass, endingClass) => {
    // Arrange & Act
    render(
      <Drawer open={true}>
        <DrawerContent side={side}>
          <DrawerTitle>{side} drawer</DrawerTitle>
        </DrawerContent>
      </Drawer>
    );

    const dialog = screen.getByRole('dialog');

    // Assert
    expect(dialog.className).toContain(startingClass);
    expect(dialog.className).toContain(endingClass);
    expect(dialog.className).toContain('data-[starting-style]:opacity-0');
    expect(dialog.className).toContain('data-[ending-style]:opacity-0');
    expect(dialog.className).not.toContain('animate-in');
    expect(dialog.className).not.toContain('animate-out');
  });

  it('should render default English close sr-only text and aria-label when outside LocaleProvider', () => {
    // Arrange & Act
    render(
      <Drawer open={true}>
        <DrawerContent>
          <DrawerTitle>Drawer Content</DrawerTitle>
        </DrawerContent>
      </Drawer>
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
  ] as const)('should render localized close label for locale %s', (locale, expectedLabel) => {
    // Arrange & Act
    render(
      <MockLocaleProvider value={{ locale: locale as Locale }}>
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Localized Drawer</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </MockLocaleProvider>
    );

    // Assert
    const closeBtn = screen.getByRole('button', { name: expectedLabel });
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('aria-label')).toBe(expectedLabel);
    const srOnly = closeBtn.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe(expectedLabel);
  });

  it('should allow custom closeLabel prop override', () => {
    // Arrange & Act
    render(
      <Drawer open={true}>
        <DrawerContent closeLabel="Custom Drawer Close">
          <DrawerTitle>Custom Label Drawer</DrawerTitle>
        </DrawerContent>
      </Drawer>
    );

    // Assert
    const closeBtn = screen.getByRole('button', { name: 'Custom Drawer Close' });
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.getAttribute('aria-label')).toBe('Custom Drawer Close');
    const srOnly = closeBtn.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe('Custom Drawer Close');
  });

  it('should omit close button when showClose is false', () => {
    // Arrange & Act
    render(
      <Drawer open={true}>
        <DrawerContent showClose={false}>
          <DrawerTitle>No Close Button</DrawerTitle>
        </DrawerContent>
      </Drawer>
    );

    // Assert
    expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
  });
});

