import React from 'react';
import { Button } from '@components/ui/button';
import { InlineCluster } from '@components/ui/stack';
import { Tag as TagIcon, X } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { cn } from '@/lib/utils';
import { normalizeTag } from '@common/utils/tagUtils';

export interface TagFilterGroupProps {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags?: () => void;
  className?: string;
  size?: 'xs' | 'sm';
}

/**
 * Composite TagFilterGroup component: Renders accessible, interactive tag chips
 * supporting multi-selection with OR semantics for report and view filtering.
 */
export function TagFilterGroup({
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
  className,
  size = 'xs',
}: TagFilterGroupProps) {
  const { t: tReport } = useTranslation('report');

  if (tags.length === 0) {
    return null;
  }

  const normalizedSelected = new Set(selectedTags.map(normalizeTag).filter((t) => t.length > 0));
  const hasSelection = normalizedSelected.size > 0;

  return (
    <InlineCluster
      gap="xs"
      className={cn('items-center flex-wrap', className)}
      data-testid="tag-filter-group"
      role="group"
      aria-label={tReport('FilterByTags')}
    >
      {tags.map((rawTag) => {
        const tag = normalizeTag(rawTag);
        const isSelected = normalizedSelected.has(tag);
        return (
          <Button
            key={tag}
            type="button"
            size={size}
            variant={isSelected ? 'accent' : 'outline'}
            aria-pressed={isSelected}
            onClick={() => onToggleTag(tag)}
            icon={<TagIcon className={cn('opacity-70', size === 'sm' ? 'size-3.5' : 'size-3')} />}
            data-testid={`tag-chip-${tag}`}
            className={cn(
              'rounded-lg font-mono text-xs transition-all shadow-none cursor-pointer',
              isSelected
                ? 'font-bold shadow-xs'
                : 'bg-card text-muted-foreground hover:text-foreground border-border/80'
            )}
          >
            #{tag}
          </Button>
        );
      })}

      {hasSelection && onClearTags && (
        <Button
          type="button"
          size={size}
          variant="ghost"
          onClick={onClearTags}
          icon={<X className={cn('opacity-80', size === 'sm' ? 'size-3.5' : 'size-3')} />}
          data-testid="clear-tags-button"
          className="text-xs text-muted-foreground hover:text-destructive h-6 px-1.5 rounded-md cursor-pointer"
          aria-label={tReport('ClearFilter')}
        >
          {tReport('ClearFilter')}
        </Button>
      )}
    </InlineCluster>
  );
}

export default TagFilterGroup;
