// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BackgroundGradients from '@layouts/components/BackgroundGradients';

describe('Unit Tests: BackgroundGradients', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('Given BackgroundGradients rendered, Then it should render ambient gradients container with aria-hidden', () => {
    const { container } = render(<BackgroundGradients />);
    const root = container.querySelector('.ambient-gradients');
    expect(root).not.toBeNull();
    expect(root?.getAttribute('aria-hidden')).toBe('true');
  });

  it('Given BackgroundGradients rendered, Then it should render ambient color token layers', () => {
    const { container } = render(<BackgroundGradients />);
    const divs = container.querySelectorAll('.ambient-gradients > div');
    expect(divs).toHaveLength(3);
    const classes = Array.from(divs).map(d => d.className);
    expect(classes.some(c => c.includes('bg-ambient-1'))).toBe(true);
    expect(classes.some(c => c.includes('bg-ambient-2'))).toBe(true);
    expect(classes.some(c => c.includes('bg-ambient-3'))).toBe(true);
  });
});
