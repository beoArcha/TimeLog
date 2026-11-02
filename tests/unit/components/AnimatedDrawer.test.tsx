// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
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

  it('should call onClose exactly once when backdrop is clicked without duplicate triggers', () => {
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

  it('should call onClose exactly once when Escape key is pressed without duplicate triggers', () => {
    // Arrange
    const onClose = vi.fn();
    render(
      <AnimatedDrawer isOpen={true} onClose={onClose} title="CLI Terminal">
        <div>Content</div>
      </AnimatedDrawer>
    );

    // Act
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

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

  it('should render wrapperId, containerId and backdropId when open', () => {
    // Arrange & Act
    render(
      <AnimatedDrawer
        isOpen={true}
        onClose={vi.fn()}
        wrapperId="custom-drawer-wrapper"
        containerId="custom-drawer-container"
        backdropId="custom-drawer-backdrop"
      >
        <div>Content</div>
      </AnimatedDrawer>
    );

    // Assert
    expect(document.querySelector('#custom-drawer-wrapper')).not.toBeNull();
    expect(document.querySelector('#custom-drawer-container')).not.toBeNull();
    expect(document.querySelector('#custom-drawer-backdrop')).not.toBeNull();
  });

  it('should apply pure CSS transition classes for data-starting-style and data-ending-style', () => {
    // Arrange & Act
    render(
      <AnimatedDrawer isOpen={true} onClose={vi.fn()} title="CLI Terminal">
        <div>Content</div>
      </AnimatedDrawer>
    );

    const dialog = screen.getByRole('dialog');
    const backdrop = document.querySelector('[data-slot="drawer-backdrop"]');

    // Assert: pure CSS transitions without competing keyframe animation classes
    expect(dialog.className).toContain('transition-all');
    expect(dialog.className).toContain('duration-300');
    expect(dialog.className).toContain('data-[starting-style]:opacity-0');
    expect(dialog.className).toContain('data-[ending-style]:opacity-0');
    expect(dialog.className).toContain('data-[starting-style]:-translate-y-full');
    expect(dialog.className).toContain('data-[ending-style]:-translate-y-full');
    expect(dialog.className).not.toContain('animate-in');
    expect(dialog.className).not.toContain('animate-out');

    expect(backdrop?.className).toContain('transition-all');
    expect(backdrop?.className).toContain('duration-300');
    expect(backdrop?.className).toContain('data-[starting-style]:opacity-0');
    expect(backdrop?.className).toContain('data-[ending-style]:opacity-0');
    expect(backdrop?.className).not.toContain('animate-in');
  });

  it('should keep popup in DOM during exit animation and unmount after animation finishes, supporting reopen', async () => {
    // Arrange: simulate Web Animations API transition cycle observed by Base UI
    let finishAnimation: () => void = () => {};
    const animationPromise = new Promise<void>((resolve) => {
      finishAnimation = resolve;
    });

    const mockAnimation = {
      finished: animationPromise,
      pending: false,
      playState: 'running',
    } as unknown as Animation;

    const { rerender } = render(
      <AnimatedDrawer isOpen={true} onClose={vi.fn()} title="CLI Terminal">
        <div>Content</div>
      </AnimatedDrawer>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();

    // Attach mock active animation to dialog element
    dialog.getAnimations = () => [mockAnimation];

    // Act: close the drawer
    rerender(
      <AnimatedDrawer isOpen={false} onClose={vi.fn()} title="CLI Terminal">
        <div>Content</div>
      </AnimatedDrawer>
    );

    // Assert: while animation is active, Base UI applies data-ending-style and retains dialog in DOM
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(dialog.getAttribute('data-ending-style')).toBe('');

    // Act: complete the transition animation
    finishAnimation();

    // Assert: dialog unmounts once the animation promise settles
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    // Act: re-open drawer
    rerender(
      <AnimatedDrawer isOpen={true} onClose={vi.fn()} title="CLI Terminal">
        <div>Content</div>
      </AnimatedDrawer>
    );

    // Assert: dialog successfully re-mounts
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
