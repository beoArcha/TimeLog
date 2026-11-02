// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Grid } from '@components/ui/grid';

describe('Unit Tests: Grid Primitive', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render default grid as a div with default variants (cols=1, gap=md)', () => {
    const { container } = render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );

    const element = container.querySelector('[data-slot="grid"]');
    expect(element).toBeTruthy();
    expect(element?.tagName.toLowerCase()).toBe('div');
    expect(element?.className).toContain('grid');
    expect(element?.className).toContain('grid-cols-1');
    expect(element?.className).toContain('gap-3');
  });

  it('should support column variants', () => {
    const colsList = [1, 2, 3, 4, 6, 12] as const;
    colsList.forEach((cols) => {
      cleanup();
      const { container } = render(
        <Grid cols={cols}>
          <div>Col item</div>
        </Grid>
      );
      const element = container.querySelector('[data-slot="grid"]');
      expect(element?.className).toContain(`grid-cols-${cols}`);
    });
  });

  it('should support gap variants', () => {
    const gapMap: Record<string, string> = {
      none: 'gap-0',
      xs: 'gap-1.5',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-6',
      '2xl': 'gap-8',
    };

    Object.entries(gapMap).forEach(([gapKey, expectedClass]) => {
      cleanup();
      const { container } = render(
        <Grid gap={gapKey as never}>
          <div>Item</div>
        </Grid>
      );
      const element = container.querySelector('[data-slot="grid"]');
      expect(element?.className).toContain(expectedClass);
    });
  });

  it('should support align variants', () => {
    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    } as const;

    Object.entries(alignMap).forEach(([alignKey, expectedClass]) => {
      cleanup();
      const { container } = render(
        <Grid align={alignKey}>
          <div>Aligned item</div>
        </Grid>
      );
      const element = container.querySelector('[data-slot="grid"]');
      expect(element?.className).toContain(expectedClass);
    });
  });

  it('should render polymorphic elements via as prop', () => {
    const asElements = ['div', 'section', 'article', 'ul', 'ol'] as const;
    asElements.forEach((asTag) => {
      cleanup();
      const { container } = render(
        <Grid as={asTag}>
          <div>Content</div>
        </Grid>
      );
      const element = container.querySelector(`${asTag}[data-slot="grid"]`);
      expect(element).toBeTruthy();
      expect(element?.tagName.toLowerCase()).toBe(asTag);
    });
  });

  it('should test explicit as override from default div to section, article, ul, ol', () => {
    // Default renders as div
    const { container: defaultContainer } = render(<Grid>Default</Grid>);
    const defaultEl = defaultContainer.querySelector('[data-slot="grid"]');
    expect(defaultEl?.tagName.toLowerCase()).toBe('div');

    // Explicit override to section
    const { container: sectionContainer } = render(<Grid as="section">Section</Grid>);
    const sectionEl = sectionContainer.querySelector('[data-slot="grid"]');
    expect(sectionEl?.tagName.toLowerCase()).toBe('section');

    // Explicit override to ul
    const { container: ulContainer } = render(<Grid as="ul"><li>List item</li></Grid>);
    const ulEl = ulContainer.querySelector('[data-slot="grid"]');
    expect(ulEl?.tagName.toLowerCase()).toBe('ul');
  });

  it('should forward ref to the underlying element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Grid ref={ref}>Ref Content</Grid>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should merge custom className', () => {
    const { container } = render(<Grid className="custom-class" />);
    const element = container.querySelector('[data-slot="grid"]');
    expect(element?.className).toContain('custom-class');
    expect(element?.className).toContain('grid');
  });
});
