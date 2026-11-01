// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Kbd } from '@components/ui/kbd';

describe('Kbd Primitive', () => {
  afterEach(cleanup);

  it('renders kbd element with default variant and size', () => {
    render(<Kbd>Ctrl+K</Kbd>);
    const kbd = screen.getByText('Ctrl+K');
    expect(kbd.tagName.toLowerCase()).toBe('kbd');
    expect(kbd.getAttribute('data-slot')).toBe('kbd');
    expect(kbd.className).toContain('font-mono');
    expect(kbd.className).toContain('border-border');
    expect(kbd.className).toContain('bg-muted');
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Kbd variant="outline">Esc</Kbd>);
    expect(screen.getByText('Esc').className).toContain('bg-background');

    rerender(<Kbd variant="destructive">Delete</Kbd>);
    expect(screen.getByText('Delete').className).toContain('text-destructive');

    rerender(<Kbd variant="ghost">Tab</Kbd>);
    expect(screen.getByText('Tab').className).toContain('bg-transparent');

    rerender(<Kbd variant="secondary">Alt</Kbd>);
    expect(screen.getByText('Alt').className).toContain('bg-secondary');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<Kbd size="xs">F1</Kbd>);
    expect(screen.getByText('F1').className).toContain('h-4');

    rerender(<Kbd size="sm">F2</Kbd>);
    expect(screen.getByText('F2').className).toContain('h-5');

    rerender(<Kbd size="md">F3</Kbd>);
    expect(screen.getByText('F3').className).toContain('h-6');

    rerender(<Kbd size="lg">F4</Kbd>);
    expect(screen.getByText('F4').className).toContain('h-7');
  });

  it('forwards ref and merges custom className', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Kbd ref={ref} className="custom-kbd-class" aria-label="Enter key">
        Enter
      </Kbd>
    );

    const kbd = screen.getByText('Enter');
    expect(ref.current).toBe(kbd);
    expect(kbd.className).toContain('custom-kbd-class');
    expect(kbd.getAttribute('aria-label')).toBe('Enter key');
  });
});
