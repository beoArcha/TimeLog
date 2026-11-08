import { describe, it, expect } from 'vitest';
import * as Components from '@components/index';
import { TagFilterGroup, CurrencyStatBadge, CodeBlock } from '@components/index';
import { TagFilterGroup as DirectTagFilterGroup } from '@components/TagFilterGroup';
import { CurrencyStatBadge as DirectCurrencyStatBadge } from '@components/CurrencyStatBadge';
import { CodeBlock as DirectCodeBlock } from '@components/CodeBlock';

describe('Components barrel (src/components/index.ts)', () => {
  it('should export TagFilterGroup from components barrel', () => {
    // Arrange & Act & Assert
    expect(Components.TagFilterGroup).toBeDefined();
    expect(typeof Components.TagFilterGroup).toBe('function');
    expect(TagFilterGroup).toBe(DirectTagFilterGroup);
  });

  it('should export CurrencyStatBadge and CodeBlock from components barrel', () => {
    // Arrange & Act & Assert
    expect(Components.CurrencyStatBadge).toBeDefined();
    expect(typeof Components.CurrencyStatBadge).toBe('function');
    expect(CurrencyStatBadge).toBe(DirectCurrencyStatBadge);

    expect(Components.CodeBlock).toBeDefined();
    expect(typeof Components.CodeBlock).toBe('function');
    expect(CodeBlock).toBe(DirectCodeBlock);
  });

  it('should export composite and layout components', () => {
    // Arrange & Act & Assert
    expect(Components.AnimatedCard).toBeDefined();
    expect(Components.AnimatedCollapse).toBeDefined();
    expect(Components.AnimatedDrawer).toBeDefined();
    expect(Components.AnimatedFade).toBeDefined();
    expect(Components.CodeBlock).toBeDefined();
    expect(Components.CollapsibleCard).toBeDefined();
    expect(Components.ConfirmDialog).toBeDefined();
    expect(Components.CurrencyStatBadge).toBeDefined();
    expect(Components.DataTable).toBeDefined();
    expect(Components.EmojiPicker).toBeDefined();
    expect(Components.EmptyState).toBeDefined();
    expect(Components.FilterBar).toBeDefined();
    expect(Components.PromptDialog).toBeDefined();
    expect(Components.RootErrorBoundary).toBeDefined();
    expect(Components.SearchInput).toBeDefined();
    expect(Components.SegmentedControl).toBeDefined();
    expect(Components.StatCard).toBeDefined();
    expect(Components.SyncStatusBadge).toBeDefined();
    expect(Components.TagFilterGroup).toBeDefined();
    expect(Components.TrendIndicator).toBeDefined();
    expect(Components.ViewHeader).toBeDefined();
  });
});
