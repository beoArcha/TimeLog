// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { StatusDot } from '@components/ui/status-dot';

describe('StatusDot', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render standard static emerald dot when ping is false', () => {
    // Arrange & Act
    const { container } = render(<StatusDot />);

    // Assert
    const element = container.querySelector('[data-slot="status-dot"]');
    expect(element).toBeTruthy();
    expect(element?.className).toContain('bg-emerald-500');
    expect(element?.className).toContain('rounded-full');
    expect(element?.className).not.toContain('animate-ping');
  });

  it('should render animated ping circle and solid center when ping is true', () => {
    // Arrange & Act
    const { container } = render(<StatusDot variant="rose" size="sm" ping />);

    // Assert
    const wrapper = container.querySelector('[data-slot="status-dot"]');
    expect(wrapper).toBeTruthy();
    expect(wrapper?.className).toContain('w-2.5');
    expect(wrapper?.className).toContain('h-2.5');

    const pingEl = wrapper?.querySelector('.animate-ping');
    expect(pingEl).toBeTruthy();
    expect(pingEl?.className).toContain('bg-rose-400');

    const solidEl = wrapper?.querySelector('.rounded-full:not(.animate-ping)');
    expect(solidEl).toBeTruthy();
    expect(solidEl?.className).toContain('bg-rose-500');
  });

  it('should apply custom variant colors correctly', () => {
    // Arrange & Act
    const { container } = render(<StatusDot variant="amber" size="2xs" />);

    // Assert
    const element = container.querySelector('[data-slot="status-dot"]');
    expect(element).toBeTruthy();
    expect(element?.className).toContain('bg-amber-500');
    expect(element?.className).toContain('w-1.5');
    expect(element?.className).toContain('h-1.5');
  });
});
