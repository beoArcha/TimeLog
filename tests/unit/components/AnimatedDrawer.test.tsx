// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AnimatedDrawer } from '@components/AnimatedDrawer';

describe('AnimatedDrawer', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render dialog content and backdrop when isOpen is true', () => {
    // Arrange & Act
    render(
      <AnimatedDrawer isOpen={true} onClose={vi.fn()} title="CLI Terminal">
        <div>Drawer body content</div>
      </AnimatedDrawer>
    );

    // Assert
    expect(screen.getByText('Drawer body content')).toBeTruthy();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('CLI Terminal');
  });

  it('should not render content when isOpen is false', () => {
    // Arrange & Act
    render(
      <AnimatedDrawer isOpen={false} onClose={vi.fn()} title="CLI Terminal">
        <div>Hidden drawer content</div>
      </AnimatedDrawer>
    );

    // Assert
    expect(screen.queryByText('Hidden drawer content')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should call onClose when backdrop is clicked', () => {
    // Arrange
    const onClose = vi.fn();
    render(
      <AnimatedDrawer
        isOpen={true}
        onClose={onClose}
        backdropId="custom-backdrop"
      >
        <div>Content</div>
      </AnimatedDrawer>
    );

    // Act
    const backdrop = document.querySelector('#custom-backdrop');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    // Arrange
    const onClose = vi.fn();
    render(
      <AnimatedDrawer isOpen={true} onClose={onClose} title="CLI Terminal">
        <div>Content</div>
      </AnimatedDrawer>
    );

    // Act
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should respect controlled isOpen prop updates', () => {
    // Arrange
    const { rerender } = render(
      <AnimatedDrawer isOpen={true} onClose={vi.fn()} title="CLI Terminal">
        <div>Content</div>
      </AnimatedDrawer>
    );
    expect(screen.getByRole('dialog')).toBeTruthy();

    // Act
    rerender(
      <AnimatedDrawer isOpen={false} onClose={vi.fn()} title="CLI Terminal">
        <div>Content</div>
      </AnimatedDrawer>
    );

    // Assert
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
