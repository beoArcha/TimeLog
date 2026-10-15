// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { TimerDisplay } from '@/src/features/timelogs/components/TimerDisplay';

describe('Unit Tests: TimerDisplay', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders pre-formatted string value', () => {
    render(<TimerDisplay value="01:23:45" />);
    expect(screen.getByText('01:23:45')).toBeTruthy();
  });

  it('formats numeric seconds value', () => {
    render(<TimerDisplay value={3665} />);
    // 3665 seconds = 01:01:05
    expect(screen.getByText('01:01:05')).toBeTruthy();
  });

  it('renders running state with indicator style', () => {
    render(<TimerDisplay value="00:15:30" isRunning={true} variant="pill" />);
    const el = screen.getByText('00:15:30');
    expect(el.className).toContain('bg-amber-500/20');
  });

  it('renders idle pill variant with neutral border', () => {
    render(<TimerDisplay value="00:00:00" isRunning={false} variant="pill" />);
    const el = screen.getByText('00:00:00');
    expect(el.className).toContain('border-border');
  });
});
