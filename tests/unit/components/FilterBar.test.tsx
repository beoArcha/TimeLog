// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FilterBar } from '@components/FilterBar';

describe('FilterBar', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render search input, children elements, and right actions when all props are provided', () => {
    // Arrange
    const onSearchChange = vi.fn();
    render(
      <FilterBar
        search={{
          value: 'active-query',
          onChange: onSearchChange,
          placeholder: 'Search tasks...',
          ariaLabel: 'Search tasks filter',
        }}
        rightActions={<button type="button" data-testid="right-action-btn">Export</button>}
        testId="custom-filter-bar"
      >
        <span data-testid="filter-child">Child Filter Content</span>
      </FilterBar>
    );

    // Act
    const filterBar = screen.getByTestId('custom-filter-bar');
    const searchbox = screen.getByRole('searchbox');
    const child = screen.getByTestId('filter-child');
    const rightAction = screen.getByTestId('right-action-btn');

    // Assert
    expect(filterBar).toBeTruthy();
    expect(filterBar.getAttribute('data-slot')).toBe('filter-bar');
    expect(searchbox).toBeTruthy();
    expect(screen.getByDisplayValue('active-query')).toBeTruthy();
    expect(child).toBeTruthy();
    expect(rightAction).toBeTruthy();
  });

  it('should render only children when search and rightActions are omitted', () => {
    // Arrange
    render(
      <FilterBar testId="children-only-bar">
        <span data-testid="child-element">Tag Selector</span>
      </FilterBar>
    );

    // Act
    const filterBar = screen.getByTestId('children-only-bar');
    const searchbox = screen.queryByRole('searchbox');
    const child = screen.getByTestId('child-element');

    // Assert
    expect(filterBar).toBeTruthy();
    expect(searchbox).toBeNull();
    expect(child).toBeTruthy();
  });

  it('should render empty container with default attributes when rendered with no props', () => {
    // Arrange
    render(<FilterBar testId="empty-filter-bar" />);

    // Act
    const filterBar = screen.getByTestId('empty-filter-bar');

    // Assert
    expect(filterBar).toBeTruthy();
    expect(filterBar.getAttribute('data-slot')).toBe('filter-bar');
    expect(filterBar.children.length).toBe(0);
  });

  it('should apply custom className and preserve default styling classes when className is passed', () => {
    // Arrange
    render(<FilterBar testId="styled-filter-bar" className="custom-test-class" />);

    // Act
    const filterBar = screen.getByTestId('styled-filter-bar');

    // Assert
    expect(filterBar.className).toContain('custom-test-class');
    expect(filterBar.className).toContain('rounded-2xl');
  });

  it('should trigger search onChange callback when user types in search input', () => {
    // Arrange
    const onSearchChange = vi.fn();
    render(
      <FilterBar
        search={{
          value: '',
          onChange: onSearchChange,
          placeholder: 'Filter items',
        }}
        testId="search-filter-bar"
      />
    );

    // Act
    const input = screen.getByPlaceholderText('Filter items');
    fireEvent.change(input, { target: { value: 'new search term' } });

    // Assert
    expect(onSearchChange).toHaveBeenCalledWith('new search term');
  });

  it('should trigger search onClear callback when clear button is clicked', () => {
    // Arrange
    const onSearchChange = vi.fn();
    const onClear = vi.fn();
    render(
      <FilterBar
        search={{
          value: 'query to clear',
          onChange: onSearchChange,
          onClear: onClear,
          placeholder: 'Filter items',
        }}
        testId="search-filter-bar"
      />
    );

    // Act
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    // Assert
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
