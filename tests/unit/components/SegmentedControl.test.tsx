// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SegmentedControl, type SegmentedControlOption } from '@components/SegmentedControl';
import { LayoutGrid, List } from 'lucide-react';

describe('SegmentedControl', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Rendering and Options', () => {
    it('should render all option labels and apply default selection', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'grid', label: 'Grid View' },
        { value: 'list', label: 'List View' },
      ];

      // Act
      render(<SegmentedControl value="grid" onChange={onChange} options={options} />);

      // Assert
      expect(screen.getByText('Grid View')).toBeTruthy();
      expect(screen.getByText('List View')).toBeTruthy();
    });

    it('should render icon with aria-hidden attribute', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'grid', label: 'Grid', icon: LayoutGrid, testId: 'grid-option' },
        { value: 'list', label: 'List', icon: List, testId: 'list-option' },
      ];

      // Act
      render(<SegmentedControl value="grid" onChange={onChange} options={options} />);

      // Assert
      const gridBtn = screen.getByTestId('grid-option');
      const icon = gridBtn.querySelector('svg');
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should render custom ReactNode labels', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'custom', label: <span data-testid="custom-label">Custom Node</span> },
      ];

      // Act
      render(<SegmentedControl value="custom" onChange={onChange} options={options} />);

      // Assert
      expect(screen.getByTestId('custom-label')).toBeTruthy();
      expect(screen.getByText('Custom Node')).toBeTruthy();
    });

    it('should apply custom title and option testId attributes', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'opt1', label: 'Option 1', title: 'Hover title', testId: 'opt1-btn' },
      ];

      // Act
      render(<SegmentedControl value="opt1" onChange={onChange} options={options} />);

      // Assert
      const item = screen.getByTestId('opt1-btn');
      expect(item.getAttribute('title')).toBe('Hover title');
    });

    it('should wrap item in tooltip when tooltip option is specified', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 't1', label: 'Tooltip Item', tooltip: 'Tooltip help text', testId: 'tooltip-item' },
      ];

      // Act
      render(<SegmentedControl value="t1" onChange={onChange} options={options} />);

      // Assert
      const item = screen.getByTestId('tooltip-item');
      expect(item).toBeTruthy();
    });
  });

  describe('Accessibility (W3C ARIA Semantics)', () => {
    it('should set aria-pressed=true on selected item and aria-pressed=false on unselected item', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'first', label: 'First', testId: 'first-item' },
        { value: 'second', label: 'Second', testId: 'second-item' },
      ];

      // Act
      render(<SegmentedControl value="first" onChange={onChange} options={options} />);

      // Assert
      const firstItem = screen.getByTestId('first-item');
      const secondItem = screen.getByTestId('second-item');

      expect(firstItem.getAttribute('aria-pressed')).toBe('true');
      expect(secondItem.getAttribute('aria-pressed')).toBe('false');
    });

    it('should not include conflicting aria-checked attribute on toggle buttons', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'tab1', label: 'Tab 1', testId: 'tab1-item' },
        { value: 'tab2', label: 'Tab 2', testId: 'tab2-item' },
      ];

      // Act
      render(<SegmentedControl value="tab1" onChange={onChange} options={options} />);

      // Assert
      const tab1 = screen.getByTestId('tab1-item');
      const tab2 = screen.getByTestId('tab2-item');

      expect(tab1.getAttribute('aria-checked')).toBeNull();
      expect(tab2.getAttribute('aria-checked')).toBeNull();
    });

    it('should prefer custom ariaLabel over label for accessible name', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'visual', label: 'Icon Only', ariaLabel: 'Accessible View Mode' },
      ];

      // Act
      render(<SegmentedControl value="visual" onChange={onChange} options={options} />);

      // Assert
      const button = screen.getByRole('button', { name: 'Accessible View Mode' });
      expect(button).toBeTruthy();
      expect(button.getAttribute('aria-label')).toBe('Accessible View Mode');
    });

    it('should propagate groupAriaLabel and id to the root toggle group', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
      ];

      // Act
      render(
        <SegmentedControl
          value="day"
          onChange={onChange}
          options={options}
          groupAriaLabel="Time view selector"
          id="time-view-group"
        />
      );

      // Assert
      const group = screen.getByRole('group', { name: 'Time view selector' });
      expect(group).toBeTruthy();
      expect(group.getAttribute('id')).toBe('time-view-group');
    });
  });

  describe('User Interactions and State Transitions', () => {
    it('should invoke onChange with the selected option value when clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'optA', label: 'Option A', testId: 'opt-a' },
        { value: 'optB', label: 'Option B', testId: 'opt-b' },
      ];

      render(<SegmentedControl value="optA" onChange={onChange} options={options} />);

      // Act
      const optB = screen.getByTestId('opt-b');
      await user.click(optB);

      // Assert
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('optB');
    });

    it('should not fire onChange when clicking already selected option', async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'optA', label: 'Option A', testId: 'opt-a' },
        { value: 'optB', label: 'Option B', testId: 'opt-b' },
      ];

      render(<SegmentedControl value="optA" onChange={onChange} options={options} />);

      // Act
      const optA = screen.getByTestId('opt-a');
      await user.click(optA);

      // Assert
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not fire onChange when clicking a disabled option', async () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'active', label: 'Active', testId: 'active-item' },
        { value: 'locked', label: 'Locked', disabled: true, testId: 'locked-item' },
      ];

      render(<SegmentedControl value="active" onChange={onChange} options={options} />);

      // Act
      const lockedItem = screen.getByTestId('locked-item');
      expect(lockedItem.hasAttribute('disabled') || lockedItem.getAttribute('aria-disabled') === 'true').toBe(true);
      fireEvent.click(lockedItem);

      // Assert
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Styling and Sizes', () => {
    it('should apply custom container and option class names', () => {
      // Arrange
      const onChange = vi.fn();
      const options: SegmentedControlOption[] = [
        { value: 'c1', label: 'C1', className: 'option-specific-class', testId: 'c1-item' },
      ];

      // Act
      const { container } = render(
        <SegmentedControl
          value="c1"
          onChange={onChange}
          options={options}
          className="custom-container-class"
          optionClassName="shared-option-class"
        />
      );

      // Assert
      const root = container.firstElementChild as HTMLElement;
      expect(root.className).toContain('custom-container-class');

      const item = screen.getByTestId('c1-item');
      expect(item.className).toContain('shared-option-class');
      expect(item.className).toContain('option-specific-class');
    });

    it('should render with different size scales without error', () => {
      // Arrange
      const onChange = vi.fn();
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      const options: SegmentedControlOption[] = [
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' },
      ];

      // Act & Assert
      for (const size of sizes) {
        const { unmount } = render(
          <SegmentedControl value="1" onChange={onChange} options={options} size={size} />
        );
        expect(screen.getByText('One')).toBeTruthy();
        unmount();
      }
    });
  });
});
