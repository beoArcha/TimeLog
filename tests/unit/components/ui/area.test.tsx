// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Area } from '@components/ui/area';

describe('Area', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render div element by default with slot attribute', () => {
    // Arrange & Act
    const { container } = render(
      <Area>
        <span>Content</span>
      </Area>
    );

    // Assert
    const element = container.querySelector('[data-slot="area"]');
    expect(element).toBeTruthy();
    expect(element?.tagName.toLowerCase()).toBe('div');
  });

  it('should render polymorphic element when as prop is specified', () => {
    // Arrange & Act
    render(
      <Area as="aside" aria-label="Sidebar Area">
        <span>Sidebar body</span>
      </Area>
    );

    // Assert
    const aside = screen.getByRole('complementary', { name: 'Sidebar Area' });
    expect(aside).toBeTruthy();
    expect(aside.tagName.toLowerCase()).toBe('aside');
  });

  it('should apply variant, padding, radius and elevation classes when props are passed', () => {
    // Arrange & Act
    const { container } = render(
      <Area
        variant="glass"
        padding="main"
        radius="3xl"
        elevation="2xl"
      >
        <span>Glass Surface</span>
      </Area>
    );

    // Assert
    const element = container.querySelector('[data-slot="area"]');
    expect(element?.className).toContain('bg-card/75');
    expect(element?.className).toContain('backdrop-blur-xl');
    expect(element?.className).toContain('p-6');
    expect(element?.className).toContain('rounded-3xl');
    expect(element?.className).toContain('shadow-2xl');
  });

  it('should forward ref to underlying element', () => {
    // Arrange
    const ref = React.createRef<HTMLElement>();

    // Act
    render(
      <Area ref={ref} as="section">
        <span>Section content</span>
      </Area>
    );

    // Assert
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName.toLowerCase()).toBe('section');
  });
});
