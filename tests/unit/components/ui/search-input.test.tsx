// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SearchInput } from '@components/ui/search-input';

describe('SearchInput', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render search input with placeholder and accessible name', () => {
    // Arrange
    const placeholder = 'Search tasks...';

    // Act
    render(
      <SearchInput
        value=""
        onChange={() => {}}
        placeholder={placeholder}
      />
    );

    // Assert
    const input = screen.getByRole('searchbox');
    expect(input).toBeTruthy();
    expect(input.getAttribute('placeholder')).toBe(placeholder);
    expect(input.getAttribute('aria-label')).toBe(placeholder);
  });

  it('should not render clear button when value is empty', () => {
    // Arrange & Act
    render(
      <SearchInput
        value=""
        onChange={() => {}}
      />
    );

    // Assert
    const clearButton = screen.queryByRole('button', { name: /clear/i });
    expect(clearButton).toBeNull();
  });

  it('should render clear button and invoke onClear when clear button is clicked', () => {
    // Arrange
    const onClear = vi.fn();
    render(
      <SearchInput
        value="current query"
        onChange={() => {}}
        onClear={onClear}
      />
    );
    const clearButton = screen.getByRole('button', { name: /clear/i });

    // Act
    fireEvent.click(clearButton);

    // Assert
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should provide compliant synthetic event with empty currentTarget value when cleared via button', () => {
    // Arrange
    let receivedTargetValue = 'initial';
    let receivedCurrentTargetValue = 'initial';
    let isPreventDefaultCallable = false;
    let isStopPropagationCallable = false;

    const onChange = vi.fn((e: React.ChangeEvent<HTMLInputElement>) => {
      receivedTargetValue = e.target.value;
      receivedCurrentTargetValue = e.currentTarget.value;
      e.preventDefault();
      e.stopPropagation();
      isPreventDefaultCallable = true;
      isStopPropagationCallable = true;
    });

    render(
      <SearchInput
        value="active filter"
        onChange={onChange}
      />
    );
    const clearButton = screen.getByRole('button', { name: /clear/i });

    // Act
    fireEvent.click(clearButton);

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(receivedTargetValue).toBe('');
    expect(receivedCurrentTargetValue).toBe('');
    expect(isPreventDefaultCallable).toBe(true);
    expect(isStopPropagationCallable).toBe(true);
  });

  it('should provide compliant synthetic event when cleared via Escape key', () => {
    // Arrange
    let capturedCurrentTargetValue = 'unmodified';
    const onChange = vi.fn((e: React.ChangeEvent<HTMLInputElement>) => {
      capturedCurrentTargetValue = e.currentTarget.value;
    });

    render(
      <SearchInput
        value="search text"
        onChange={onChange}
      />
    );
    const input = screen.getByRole('searchbox');

    // Act
    fireEvent.keyDown(input, { key: 'Escape' });

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(capturedCurrentTargetValue).toBe('');
  });

  it('should not trigger clear when Escape is pressed on empty input', () => {
    // Arrange
    const onChange = vi.fn();
    const onClear = vi.fn();

    render(
      <SearchInput
        value=""
        onChange={onChange}
        onClear={onClear}
      />
    );
    const input = screen.getByRole('searchbox');

    // Act
    fireEvent.keyDown(input, { key: 'Escape' });

    // Assert
    expect(onChange).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('should focus input element after clear button is clicked', () => {
    // Arrange
    render(
      <SearchInput
        value="query"
        onChange={() => {}}
      />
    );
    const input = screen.getByRole('searchbox');
    const clearButton = screen.getByRole('button', { name: /clear/i });

    // Act
    fireEvent.click(clearButton);

    // Assert
    expect(document.activeElement).toBe(input);
  });

  it('should ensure single accessible name on input and omit role search landmark by default', () => {
    // Arrange
    const customLabel = 'Filter project list';

    // Act
    const { container } = render(
      <SearchInput
        value=""
        onChange={() => {}}
        searchAriaLabel={customLabel}
      />
    );

    // Assert
    const landmark = screen.queryByRole('search');
    expect(landmark).toBeNull();

    const input = screen.getByRole('searchbox');
    expect(input.getAttribute('aria-label')).toBe(customLabel);

    const outerWrapper = container.firstElementChild;
    expect(outerWrapper?.getAttribute('aria-label')).toBeNull();
  });

  it('should support search landmark when role prop is explicitly search', () => {
    // Arrange
    const customLabel = 'Global search';

    // Act
    render(
      <SearchInput
        role="search"
        value=""
        onChange={() => {}}
        searchAriaLabel={customLabel}
      />
    );

    // Assert
    const landmark = screen.getByRole('search');
    expect(landmark).toBeTruthy();

    const input = screen.getByRole('searchbox');
    expect(input.getAttribute('aria-label')).toBe(customLabel);
    expect(landmark.contains(input)).toBe(true);
  });

  it('should invoke both onClear and onChange when both callbacks are supplied', () => {
    // Arrange
    const onClear = vi.fn();
    const onChange = vi.fn();

    render(
      <SearchInput
        value="dual-handler query"
        onClear={onClear}
        onChange={onChange}
      />
    );
    const clearButton = screen.getByRole('button', { name: /clear/i });

    // Act
    fireEvent.click(clearButton);

    // Assert
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
