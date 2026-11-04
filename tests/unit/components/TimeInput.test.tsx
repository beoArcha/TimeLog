// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TimeInput } from '@components/ui/time-input';

describe('TimeInput Primitive', () => {
  afterEach(cleanup);

  it('renders time input with clock icon by default', () => {
    const handleChange = vi.fn();
    render(
      <TimeInput
        data-testid="time-input-test"
        value="14:30"
        onChange={handleChange}
        aria-label="Meeting time"
      />
    );

    const input = screen.getByTestId('time-input-test') as HTMLInputElement;
    expect(input.type).toBe('time');
    expect(input.value).toBe('14:30');
    expect(input.getAttribute('aria-label')).toBe('Meeting time');
    expect(input.getAttribute('data-slot')).toBe('time-input');

    // Container should exist with clock icon
    const container = input.closest('[data-slot="time-input-container"]');
    expect(container).not.toBeNull();
  });

  it('handles value changes via onChange', () => {
    const handleChange = vi.fn();
    render(<TimeInput data-testid="time-input-change" onChange={handleChange} />);

    const input = screen.getByTestId('time-input-change');
    fireEvent.change(input, { target: { value: '09:15' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders without icon when showIcon is false', () => {
    render(
      <TimeInput
        data-testid="time-input-no-icon"
        showIcon={false}
        value="12:00"
      />
    );

    const input = screen.getByTestId('time-input-no-icon');
    expect(input.closest('[data-slot="time-input-container"]')).toBeNull();
    expect(input.getAttribute('data-slot')).toBe('time-input');
  });

  it('scales padding and icon according to size variant', () => {
    const { rerender } = render(
      <TimeInput data-testid="time-input-size" size="sm" />
    );
    let input = screen.getByTestId('time-input-size');
    expect(input.className).toContain('pl-7');
    expect(input.className).toContain('h-7');

    rerender(<TimeInput data-testid="time-input-size" size="lg" />);
    input = screen.getByTestId('time-input-size');
    expect(input.className).toContain('pl-9');
    expect(input.className).toContain('h-9');
  });

  it('forwards ref correctly to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TimeInput ref={ref} data-testid="time-input-ref" />);

    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName.toLowerCase()).toBe('input');
  });
});
