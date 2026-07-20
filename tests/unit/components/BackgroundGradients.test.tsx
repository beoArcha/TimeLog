// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import BackgroundGradients from '@components/BackgroundGradients';

describe('Unit Tests: BackgroundGradients', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('Given high-contrast theme, Then it should render nothing', () => {
    const { container } = render(<BackgroundGradients theme="high-contrast" />);
    expect(container.firstChild).toBeNull();
  });

  it('Given dark theme, Then it should render three gradient divs with dark opacity classes', () => {
    const { container } = render(<BackgroundGradients theme="dark" />);
    const divs = container.querySelectorAll('div');
    expect(divs).toHaveLength(3);
    const classes = Array.from(divs).map(d => d.className);
    expect(classes.some(c => c.includes('bg-orange-500/10'))).toBe(true);
    expect(classes.some(c => c.includes('bg-rose-500/10'))).toBe(true);
    expect(classes.some(c => c.includes('bg-violet-500/10'))).toBe(true);
  });

  it('Given light theme, Then it should render three gradient divs with light opacity classes', () => {
    const { container } = render(<BackgroundGradients theme="light" />);
    const divs = container.querySelectorAll('div');
    expect(divs).toHaveLength(3);
    const classes = Array.from(divs).map(d => d.className);
    expect(classes.some(c => c.includes('bg-orange-500/5'))).toBe(true);
    expect(classes.some(c => c.includes('bg-rose-500/5'))).toBe(true);
    expect(classes.some(c => c.includes('bg-violet-500/5'))).toBe(true);
  });
});
