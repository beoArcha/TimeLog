// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { ProjectBadge } from '@/src/features/projects/components/ProjectBadge';

describe('Unit Tests: ProjectBadge', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders project name and color dot', () => {
    render(<ProjectBadge name="Website Redesign" color="orange" />);
    expect(screen.getByText('Website Redesign')).toBeTruthy();
  });

  it('renders emoji icon when provided', () => {
    render(<ProjectBadge name="Mobile App" icon="📱" />);
    expect(screen.getByText('📱')).toBeTruthy();
    expect(screen.getByText('Mobile App')).toBeTruthy();
  });

  it('supports hiding the project name', () => {
    render(<ProjectBadge name="Stealth Project" color="emerald" showName={false} />);
    expect(screen.queryByText('Stealth Project')).toBeNull();
  });

  it('applies truncation title when name is long', () => {
    const longName = 'A'.repeat(600);
    const { container } = render(<ProjectBadge name={longName} />);
    const span = container.querySelector('span[title]');
    expect(span?.getAttribute('title')).toContain('...');
  });
});
