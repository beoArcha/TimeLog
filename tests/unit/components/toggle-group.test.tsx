// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';

describe('ToggleGroupItem', () => {
  it('should prioritize item variant and size over group defaults', () => {
    // Arrange
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
    expect(item.className).toContain('bg-background');
    expect(item.className).toContain('h-7');
    expect(item.className).not.toContain('hover:bg-muted hover:text-foreground');
  });
});
