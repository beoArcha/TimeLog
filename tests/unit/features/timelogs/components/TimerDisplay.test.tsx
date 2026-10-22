import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { TimerDisplay } from '@features/timelogs/components/TimerDisplay';

describe('TimerDisplay', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render pre-formatted string value', () => {
    // Arrange & Act
    render(<TimerDisplay value="01:23:45" />);

    // Assert
    expect(screen.getByText('01:23:45')).toBeDefined();
  });

  it('should format numeric seconds value to HH:MM:SS format', () => {
    // Arrange & Act
    render(<TimerDisplay value={3665} />);

    // Assert
    expect(screen.getByText('01:01:05')).toBeDefined();
  });

  it('should render running state correctly in pill variant', () => {
    // Arrange & Act
    render(<TimerDisplay value="00:15:30" isRunning={true} variant="pill" id="timer-active" />);

    // Assert
    const el = screen.getByText('00:15:30');
    expect(el).toBeDefined();
    expect(el.id).toBe('timer-active');
  });

  it('should render idle state correctly in pill variant', () => {
    // Arrange & Act
    render(<TimerDisplay value="00:00:00" isRunning={false} variant="pill" id="timer-idle" />);

    // Assert
    const el = screen.getByText('00:00:00');
    expect(el).toBeDefined();
    expect(el.id).toBe('timer-idle');
  });

  it('should render highlight variant and custom size classes', () => {
    // Arrange & Act
    render(
      <TimerDisplay
        value="02:30:00"
        variant="highlight"
        size="xl"
        className="custom-timer-class"
      />
    );

    // Assert
    const el = screen.getByText('02:30:00');
    expect(el).toBeDefined();
    expect(el.className).toContain('custom-timer-class');
  });

  it('should render icon alongside the formatted time when provided', () => {
    // Arrange & Act
    const { container } = render(
      <TimerDisplay
        value="00:05:00"
        icon={<span data-testid="custom-timer-icon">ICON</span>}
      />
    );

    // Assert
    expect(container.querySelector('[data-testid="custom-timer-icon"]')).toBeTruthy();
    expect(screen.getByText('00:05:00')).toBeTruthy();
  });
});
