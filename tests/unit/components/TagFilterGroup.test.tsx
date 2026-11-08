import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagFilterGroup } from '@components/TagFilterGroup';

describe('Unit Tests: TagFilterGroup', () => {
  it('Given empty tags array, When rendered, Then renders nothing', () => {
    // Arrange & Act
    const { container } = render(
      <TagFilterGroup
        tags={[]}
        selectedTags={[]}
        onToggleTag={() => {}}
      />
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('Given tags list, When rendered, Then displays normalized tag chips and calls onToggleTag when clicked', () => {
    // Arrange
    const onToggleTagMock = vi.fn();
    render(
      <TagFilterGroup
        tags={['#frontend', ' backend ', 'devops']}
        selectedTags={['#backend']}
        onToggleTag={onToggleTagMock}
      />
    );

    // Assert chips
    const frontendChip = screen.getByTestId('tag-chip-frontend');
    const backendChip = screen.getByTestId('tag-chip-backend');
    const devopsChip = screen.getByTestId('tag-chip-devops');

    expect(frontendChip).not.toBeNull();
    expect(backendChip).not.toBeNull();
    expect(devopsChip).not.toBeNull();

    expect(backendChip.getAttribute('aria-pressed')).toBe('true');
    expect(frontendChip.getAttribute('aria-pressed')).toBe('false');

    // Act
    fireEvent.click(frontendChip);

    // Assert
    expect(onToggleTagMock).toHaveBeenCalledWith('frontend');
  });

  it('Given selected tags and onClearTags handler, When clear button is clicked, Then triggers onClearTags', () => {
    // Arrange
    const onClearTagsMock = vi.fn();
    render(
      <TagFilterGroup
        tags={['tag1', 'tag2']}
        selectedTags={['tag1']}
        onToggleTag={() => {}}
        onClearTags={onClearTagsMock}
      />
    );

    // Act
    const clearBtn = screen.getByTestId('clear-tags-button');
    expect(clearBtn).not.toBeNull();
    fireEvent.click(clearBtn);

    // Assert
    expect(onClearTagsMock).toHaveBeenCalledTimes(1);
  });
});
