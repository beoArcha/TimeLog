// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AnimatedProgressBar } from '@components/AnimatedProgressBar';

describe('AnimatedProgressBar', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render progressbar with correct accessibility attributes', () => {
    // Arrange & Act
    render(
      <AnimatedProgressBar value={45} aria-label="Completion progress" />
    );

    // Assert
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute('aria-valuenow')).toBe('45');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
    expect(progressbar.getAttribute('aria-label')).toBe('Completion progress');
  });

  it('should clamp value to 0 when value is negative', () => {
    // Arrange & Act
    render(
      <AnimatedProgressBar value={-15} />
    );

    // Assert
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('should clamp value to 100 when value exceeds 100', () => {
    // Arrange & Act
    render(
      <AnimatedProgressBar value={150} />
    );

    // Assert
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('should merge custom track and indicator class names', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedProgressBar
        value={60}
        className="h-4 custom-track"
        indicatorClassName="custom-indicator"
      />
    );

    // Assert
    const track = container.firstElementChild as HTMLElement;
    expect(track.className).toContain('custom-track');
    expect(track.className).toContain('h-4');
    const indicator = track.firstElementChild as HTMLElement;
    expect(indicator.className).toContain('custom-indicator');
  });
});
