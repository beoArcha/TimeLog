// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AnimatedFade } from '@components/AnimatedFade';

describe('AnimatedFade', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render children when provided', () => {
    // Arrange
    const text = 'Fade content';

    // Act
    render(
      <AnimatedFade>
        <div>{text}</div>
      </AnimatedFade>
    );

    // Assert
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedFade className="w-full flex-1">
        <span>Content</span>
      </AnimatedFade>
    );

    // Assert
    const element = container.firstElementChild as HTMLElement;
    expect(element.className).toContain('w-full');
    expect(element.className).toContain('flex-1');
  });

  it('should forward HTML attributes when provided', () => {
    // Arrange & Act
    render(
      <AnimatedFade id="my-fade-container" data-testid="fade-test">
        <span>Content</span>
      </AnimatedFade>
    );

    // Assert
    const element = screen.getByTestId('fade-test');
    expect(element.id).toBe('my-fade-container');
  });
});
