// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AnimatedCard } from '@components/AnimatedCard';

describe('AnimatedCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render children when provided', () => {
    // Arrange
    const text = 'Card content';

    // Act
    render(
      <AnimatedCard>
        <div>{text}</div>
      </AnimatedCard>
    );

    // Assert
    expect(screen.getByText(text)).toBeTruthy();
  });

  it('should apply hover styles when hoverable is true', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedCard hoverable={true}>
        <span>Hoverable content</span>
      </AnimatedCard>
    );

    // Assert
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('hover:border-primary/30');
  });

  it('should not apply hover styles when hoverable is false', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedCard hoverable={false}>
        <span>Non-hoverable content</span>
      </AnimatedCard>
    );

    // Assert
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).not.toContain('hover:border-primary/30');
  });

  it('should merge custom className when provided', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedCard className="custom-test-class">
        <span>Content</span>
      </AnimatedCard>
    );

    // Assert
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('custom-test-class');
  });

  it('should forward event handlers and HTML props when passed', () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(
      <AnimatedCard id="test-animated-card" onClick={onClick}>
        <span>Clickable</span>
      </AnimatedCard>
    );
    const card = screen.getByText('Clickable').parentElement!;
    fireEvent.click(card);

    // Assert
    expect(card.id).toBe('test-animated-card');
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
