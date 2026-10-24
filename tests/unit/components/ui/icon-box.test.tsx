// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { IconBox } from '@components/ui/icon-box';

describe('IconBox', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render icon box with default muted variant and section rounded corners', () => {
    // Arrange & Act
    const { container } = render(
      <IconBox>
        <span>Icon</span>
      </IconBox>
    );

    // Assert
    const element = container.querySelector('[data-slot="icon-box"]');
    expect(element).toBeTruthy();
    expect(element?.tagName.toLowerCase()).toBe('div');
    expect(element?.className).toContain('rounded-section');
    expect(element?.className).toContain('bg-muted/40');
  });

  it('should render custom size, variant and rounded classes when props are passed', () => {
    // Arrange & Act
    const { container } = render(
      <IconBox size="sm" variant="outline" rounded="full">
        <span>Small Icon</span>
      </IconBox>
    );

    // Assert
    const element = container.querySelector('[data-slot="icon-box"]');
    expect(element).toBeTruthy();
    expect(element?.className).toContain('w-8');
    expect(element?.className).toContain('h-8');
    expect(element?.className).toContain('rounded-full');
    expect(element?.className).toContain('border-border');
  });

  it('should render custom polymorphic element when as prop is provided', () => {
    // Arrange & Act
    const { container } = render(
      <IconBox as="span">
        <span>Inline Icon</span>
      </IconBox>
    );

    // Assert
    const element = container.querySelector('[data-slot="icon-box"]');
    expect(element).toBeTruthy();
    expect(element?.tagName.toLowerCase()).toBe('span');
  });

  it('should forward ref to underlying element', () => {
    // Arrange
    const ref = React.createRef<HTMLDivElement>();

    // Act
    render(
      <IconBox ref={ref}>
        <span>Ref Icon</span>
      </IconBox>
    );

    // Assert
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
