import React from 'react';
import { Project } from '@bindings/Project';
import { Button } from '@components/ui/button';
import { InlineCluster } from '@components/ui/stack';
import { useTranslation } from '@common/i18n/translator';
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR_HEX } from '@common/constants/projectColors';
import { Text } from '@components/ui/typography';
import { cn } from '@/lib/utils';

export interface ReportProjectFilterProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  className?: string;
  size?: 'xs' | 'sm';
}

/**
 * Filter group for selecting a project or all projects in the report filter panel.
 */
export function ReportProjectFilter({
  projects,
  selectedProjectId,
  onSelectProject,
  className,
  size = 'xs',
}: ReportProjectFilterProps) {
  const { t: tProject } = useTranslation('project');
  const { t: tCommon } = useTranslation('common');

  if (projects.length === 0) {
    return null;
  }

  const isAllSelected = !selectedProjectId;

  return (
    <InlineCluster
      gap="sm"
      className={cn('pt-2.5 border-t border-border/40 text-xs w-full items-center', className)}
      data-testid="report-project-filter-container"
    >
      <Text as="span" variant="muted" size="xs" className="font-mono shrink-0">
        {tProject('ProjectsLabel')}:
      </Text>
      <InlineCluster
        gap="xs"
        className="items-center flex-wrap"
        data-testid="report-project-filter-group"
        role="group"
        aria-label={tProject('ProjectsLabel')}
      >
        <Button
          type="button"
          size={size}
          variant={isAllSelected ? 'accent' : 'outline'}
          aria-pressed={isAllSelected}
          onClick={() => onSelectProject(null)}
          data-testid="project-filter-all"
          className={cn(
            'rounded-lg font-mono text-xs transition-all shadow-none cursor-pointer',
            isAllSelected
              ? 'font-bold shadow-xs'
              : 'bg-card text-muted-foreground hover:text-foreground border-border/80'
          )}
        >
          {tCommon('All')}
        </Button>
        {projects.map((p) => {
          const isSelected = selectedProjectId === p.id;
          const matched = PROJECT_COLORS.find((c) => c.name === p.color);
          const hex = matched ? matched.hex : DEFAULT_PROJECT_COLOR_HEX;

          return (
            <Button
              key={p.id}
              type="button"
              size={size}
              variant={isSelected ? 'accent' : 'outline'}
              aria-pressed={isSelected}
              onClick={() => onSelectProject(isSelected ? null : p.id)}
              data-testid={`project-filter-${p.id}`}
              icon={
                <span
                  className="inline-block size-2 rounded-full shrink-0"
                  style={{ backgroundColor: hex }}
                  aria-hidden="true"
                />
              }
              className={cn(
                'rounded-lg font-mono text-xs transition-all shadow-none cursor-pointer',
                isSelected
                  ? 'font-bold shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border/80'
              )}
            >
              {p.name}
            </Button>
          );
        })}
      </InlineCluster>
    </InlineCluster>
  );
}

export default ReportProjectFilter;
