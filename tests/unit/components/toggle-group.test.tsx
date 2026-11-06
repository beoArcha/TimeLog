// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const { buttonVariantsMock } = vi.hoisted(() => ({
  buttonVariantsMock: vi.fn(() => 'mock-button-variants'),
}));

vi.mock('../../../src/components/ui/button-variants', () => ({
  buttonVariants: buttonVariantsMock,
}));

import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';

describe('ToggleGroupItem', () => {
  it('should prioritize item variant and size over group defaults', () => {
    // Arrange
    buttonVariantsMock.mockClear();
    render(
      <ToggleGroup value={[]} onValueChange={vi.fn()} variant="ghost" size="default">
        <ToggleGroupItem value="item" variant="outline" size="sm">
          Override item
        </ToggleGroupItem>
      </ToggleGroup>
    );

    // Act
    const item = screen.getByRole('button', { name: 'Override item' });

    // Assert
    expect(item).toBeTruthy();
    expect(buttonVariantsMock).toHaveBeenCalledWith({
      variant: 'outline',
      size: 'sm',
    });
  });
});
