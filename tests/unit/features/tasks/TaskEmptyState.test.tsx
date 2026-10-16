// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import TaskEmptyState from '@features/tasks/components/TaskEmptyState';

describe('Unit Tests: TaskEmptyState', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render empty state message and hint', () => {
    render(<TaskEmptyState />);

    expect(screen.getByText(/Create a main project task/i)).toBeTruthy();
  });

  it('should apply polymorphic semantic design tokens', () => {
    const { container } = render(<TaskEmptyState />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('border-border');
    expect(root.className).toContain('text-muted-foreground');
    expect(root.className).toContain('bg-muted/30');
  });
});
