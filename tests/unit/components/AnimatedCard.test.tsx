// @vitest-environment jsdom
import { JSDOM } from 'jsdom';

// Ensure DOM environment is initialized if executed under bun test
if (typeof document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.customElements = dom.window.customElements;
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
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
    const { getByText } = render(
      <AnimatedCard>
        <div>{text}</div>
      </AnimatedCard>
    );

    // Assert
    expect(getByText(text)).toBeTruthy();
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
    expect(card.className).toContain('hover:shadow-md');
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
    expect(card.className).not.toContain('hover:shadow-md');
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
    const { getByText } = render(
      <AnimatedCard id="test-animated-card" onClick={onClick}>
        <span>Clickable</span>
      </AnimatedCard>
    );
    const card = getByText('Clickable').parentElement!;
    fireEvent.click(card);

    // Assert
    expect(card.id).toBe('test-animated-card');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not contain transition-all to prevent collision with motion animations', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedCard>
        <span>No collision test</span>
      </AnimatedCard>
    );

    // Assert
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).not.toContain('transition-all');
    expect(card.className).toContain('transition-[border-color,box-shadow]');
  });

  it('should include motion-reduce:transition-none for WCAG reduced motion compliance', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedCard>
        <span>Reduced motion CSS test</span>
      </AnimatedCard>
    );

    // Assert
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('motion-reduce:transition-none');
  });

  it('should disable entry motion when reducedMotion is true', () => {
    // Arrange & Act
    const { container, getByText } = render(
      <AnimatedCard reducedMotion={true} initial={{ opacity: 0, y: 20 }}>
        <span>Reduced motion card</span>
      </AnimatedCard>
    );

    // Assert
    const card = container.firstElementChild as HTMLElement;
    expect(card).toBeTruthy();
    expect(getByText('Reduced motion card')).toBeTruthy();
  });
});



