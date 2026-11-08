// @vitest-environment jsdom
import { JSDOM } from 'jsdom';

// Setup DOM environment for bun test runner when not running inside vitest jsdom
if (typeof document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  });
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
  globalThis.KeyboardEvent = dom.window.KeyboardEvent;
  globalThis.MouseEvent = dom.window.MouseEvent;
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.Node = dom.window.Node;
}

const { render, screen, cleanup } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { StatCard } from '@components/StatCard';
import { Clock, Activity } from 'lucide-react';

describe('StatCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Static Non-Clickable Card Semantics', () => {
    it('should render title, value, icon, and description in read-only mode', () => {
      // Arrange & Act
      render(
        <StatCard
          title="Total Hours"
          value="42.5h"
          description="Logged during current cycle"
          icon={Clock}
          testId="readonly-stat-card"
        />
      );

      // Assert
      expect(screen.getByText('Total Hours')).toBeTruthy();
      expect(screen.getByText('42.5h')).toBeTruthy();
      expect(screen.getByText('Logged during current cycle')).toBeTruthy();

      const card = screen.getByTestId('readonly-stat-card');
      expect(card.tagName.toLowerCase()).not.toBe('button');
      expect(card.getAttribute('role')).toBeNull();
      expect(card.getAttribute('tabindex')).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('should render string badge and trend indicator with accessible label', () => {
      // Arrange & Act
      render(
        <StatCard
          title="Productivity"
          value="94%"
          badge="High"
          trend={{ value: '+8%', direction: 'up', label: '8% increase from last week' }}
          testId="badge-stat-card"
        />
      );

      // Assert
      expect(screen.getByText('High')).toBeTruthy();
      expect(screen.getByLabelText('8% increase from last week')).toBeTruthy();
    });

    it('should render custom ReactNode badge component correctly', () => {
      // Arrange & Act
      render(
        <StatCard
          title="Active Projects"
          value="12"
          badge={<span data-testid="custom-badge-node">Custom Badge</span>}
        />
      );

      // Assert
      expect(screen.getByTestId('custom-badge-node')).toBeTruthy();
    });
  });

  describe('Clickable Accessible Button Semantics', () => {
    it('should render as a semantic button element when onClick is provided', () => {
      // Arrange
      const onClick = vi.fn();

      // Act
      render(
        <StatCard
          title="Clickable Metric"
          value="120"
          icon={Activity}
          onClick={onClick}
          testId="interactive-stat-card"
        />
      );

      // Assert
      const button = screen.getByTestId('interactive-stat-card');
      expect(button.tagName.toLowerCase()).toBe('button');
      expect(button.getAttribute('type')).toBe('button');
      expect(screen.getByRole('button')).toBeTruthy();
      expect(button.getAttribute('role')).toBeNull(); // Native button does not need role="button"
    });

    it('should trigger onClick callback on pointer click', async () => {
      // Arrange
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <StatCard
          title="Interactive Tasks"
          value="45"
          onClick={onClick}
          testId="click-stat-card"
        />
      );

      // Act
      const button = screen.getByTestId('click-stat-card');
      await user.click(button);

      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick callback on keyboard Enter key', async () => {
      // Arrange
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <StatCard
          title="Enter Key Activation"
          value="77"
          onClick={onClick}
          testId="enter-stat-card"
        />
      );

      // Act
      const button = screen.getByTestId('enter-stat-card');
      button.focus();
      await user.keyboard('{Enter}');

      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick callback on keyboard Space key', async () => {
      // Arrange
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <StatCard
          title="Space Key Activation"
          value="88"
          onClick={onClick}
          testId="space-stat-card"
        />
      );

      // Act
      const button = screen.getByTestId('space-stat-card');
      button.focus();
      await user.keyboard(' ');

      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Styling and Accessibility Constraints', () => {
    it('should apply custom className alongside design system styles', () => {
      // Arrange & Act
      render(
        <StatCard
          title="Styled Card"
          value="5"
          className="custom-audit-class"
          testId="styled-stat-card"
        />
      );

      // Assert
      const card = screen.getByTestId('styled-stat-card');
      expect(card.className).toContain('custom-audit-class');
    });

    it('should ensure icon container is marked aria-hidden to avoid duplicate screen reader noise', () => {
      // Arrange & Act
      const { container } = render(
        <StatCard
          title="A11y Icon Card"
          value="1"
          icon={Clock}
        />
      );

      // Assert
      const iconBox = container.querySelector('[aria-hidden="true"]');
      expect(iconBox).toBeTruthy();
    });
  });
});
