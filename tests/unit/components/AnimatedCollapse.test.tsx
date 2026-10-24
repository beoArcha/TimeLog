// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AnimatedCollapse } from '@components/AnimatedCollapse';

describe('AnimatedCollapse', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render children when isOpen is true', () => {
    // Arrange & Act
    render(
      <AnimatedCollapse isOpen={true}>
        <div>Expanded body content</div>
      </AnimatedCollapse>
    );

    // Assert
    expect(screen.getByText('Expanded body content')).toBeTruthy();
  });

  it('should not render children when isOpen is false', () => {
    // Arrange & Act
    render(
      <AnimatedCollapse isOpen={false}>
        <div>Collapsed hidden content</div>
      </AnimatedCollapse>
    );

    // Assert
    expect(screen.queryByText('Collapsed hidden content')).toBeNull();
  });

  it('should apply overflow-hidden and merge custom className', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedCollapse isOpen={true} className="p-4 flex flex-col">
        <div>Content</div>
      </AnimatedCollapse>
    );

    // Assert
    const element = container.firstElementChild as HTMLElement;
    expect(element.className).toContain('overflow-hidden');
    expect(element.className).toContain('p-4');
  });

  it('should forward data-testid and id attributes when open', () => {
    // Arrange & Act
    render(
      <AnimatedCollapse isOpen={true} id="test-collapse-id" data-testid="test-collapse">
        <div>Content</div>
      </AnimatedCollapse>
    );

    // Assert
    const element = screen.getByTestId('test-collapse');
    expect(element.id).toBe('test-collapse-id');
  });
});
