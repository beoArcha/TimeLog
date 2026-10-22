// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Progress, ProgressBar } from '@components/ui/progress';

describe('Progress', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render progress bar with correct aria attributes and value when mounted', () => {
    // Arrange & Act
    render(<Progress value={45} aria-label="Task completion" />);

    // Assert
    const progress = screen.getByRole('progressbar', { name: 'Task completion' });
    expect(progress).toBeTruthy();
    expect(progress.getAttribute('aria-valuenow')).toBe('45');
    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
  });

  it('should forward ref to underlying element when ref is passed', () => {
    // Arrange
    const ref = React.createRef<HTMLDivElement>();

    // Act
    render(<Progress ref={ref} value={20} aria-label="Loading" />);

    // Assert
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('ProgressBar', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render accessible progress bar with clamped percentage when value exceeds bounds', () => {
    // Arrange & Act
    render(<ProgressBar value={120} max={100} aria-label="Upload status" />);

    // Assert
    const bar = screen.getByRole('progressbar', { name: 'Upload status' });
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('should clamp negative values to zero when value is below minimum', () => {
    // Arrange & Act
    render(<ProgressBar value={-15} min={0} max={100} aria-label="Download status" />);

    // Assert
    const bar = screen.getByRole('progressbar', { name: 'Download status' });
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('should apply custom variant and size classes when props are provided', () => {
    // Arrange & Act
    const { container } = render(
      <ProgressBar value={60} variant="orange" size="sm" aria-label="Battery" />
    );

    // Assert
    const bar = container.querySelector('[data-slot="progress-bar"]');
    const indicator = container.querySelector('[data-slot="progress-bar-indicator"]');
    expect(bar?.className).toContain('h-2');
    expect(indicator?.className).toContain('from-orange-400');
  });
});
