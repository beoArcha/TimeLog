// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Form } from '@components/ui/form';

describe('Form', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render form element with default role and vertical layout', () => {
    // Arrange & Act
    const { container } = render(
      <Form aria-label="Test Form">
        <div>Child input</div>
      </Form>
    );

    // Assert
    const form = screen.getByRole('form', { name: 'Test Form' });
    expect(form).toBeTruthy();
    expect(form.getAttribute('noValidate')).toBe('');
    expect(container.querySelector('[data-slot="form"]')).toBeTruthy();
    expect(form.className).toContain('flex flex-col');
  });

  it('should prevent default form submission when submit event is triggered and preventDefault is true', () => {
    // Arrange
    const onSubmit = vi.fn();
    render(
      <Form onSubmit={onSubmit} aria-label="Submit Form">
        <button type="submit">Submit</button>
      </Form>
    );

    // Act
    const button = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(button);

    // Assert
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const event = onSubmit.mock.calls[0][0];
    expect(event.defaultPrevented).toBe(true);
  });

  it('should apply horizontal layout class when layout is set to horizontal', () => {
    // Arrange & Act
    const { container } = render(
      <Form layout="horizontal" gap="xs" aria-label="Inline Form">
        <span>Field</span>
      </Form>
    );

    // Assert
    const form = container.querySelector('[data-slot="form"]');
    expect(form?.className).toContain('flex flex-row items-center');
    expect(form?.className).toContain('gap-1.5');
  });

  it('should forward ref to underlying HTMLFormElement', () => {
    // Arrange
    const ref = React.createRef<HTMLFormElement>();

    // Act
    render(
      <Form ref={ref} aria-label="Ref Form">
        <span>Content</span>
      </Form>
    );

    // Assert
    expect(ref.current).toBeInstanceOf(HTMLFormElement);
  });
});
