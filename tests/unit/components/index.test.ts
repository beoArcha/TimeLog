import { describe, it, expect } from 'vitest';
import * as Components from '@components/index';
import { TagFilterGroup } from '@components/index';
import { TagFilterGroup as DirectTagFilterGroup } from '@components/TagFilterGroup';

describe('Components barrel (src/components/index.ts)', () => {
  it('should export TagFilterGroup from components barrel', () => {
    expect(Components.TagFilterGroup).toBeDefined();
    expect(typeof Components.TagFilterGroup).toBe('function');
    expect(TagFilterGroup).toBe(DirectTagFilterGroup);
  });

  it('should export composite and layout components', () => {
    expect(Components.CollapsibleCard).toBeDefined();
    expect(Components.ConfirmDialog).toBeDefined();
    expect(Components.PromptDialog).toBeDefined();
    expect(Components.StatCard).toBeDefined();
    expect(Components.SegmentedControl).toBeDefined();
    expect(Components.SearchInput).toBeDefined();
    expect(Components.EmptyState).toBeDefined();
    expect(Components.DataTable).toBeDefined();
    expect(Components.RootErrorBoundary).toBeDefined();
    expect(Components.AnimatedCard).toBeDefined();
    expect(Components.AnimatedFade).toBeDefined();
    expect(Components.AnimatedCollapse).toBeDefined();
    expect(Components.AnimatedDrawer).toBeDefined();
    expect(Components.ViewHeader).toBeDefined();
    expect(Components.FilterBar).toBeDefined();
    expect(Components.TagFilterGroup).toBeDefined();
    expect(Components.TrendIndicator).toBeDefined();
    expect(Components.SyncStatusBadge).toBeDefined();
    expect(Components.EmojiPicker).toBeDefined();
  });
});
