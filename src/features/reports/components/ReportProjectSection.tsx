import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FolderKanban } from 'lucide-react';
import { Locale } from '@bindings/Locale';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { TimeLog } from '@bindings/TimeLog';
import { GroupedProject } from '../utils/grouping';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@components/ui/collapsible';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { HStack, VStack } from '@components/ui/stack';
import { MonoText, Text } from '@components/ui/typography';
import { cn } from '@/lib/utils';
import ReportTaskSection from './ReportTaskSection';

export interface ReportProjectSectionProps {
  key?: React.Key;
  projectGroup: GroupedProject;
  activeLocale?: Locale;
  timeZone?: string;
  nowIso?: string;
  isLogActive: (log: ClampedTimeLog | TimeLog) => boolean;
  onEdit: (log: ClampedTimeLog | TimeLog) => void;
  onDelete: (log: ClampedTimeLog | TimeLog) => void;
  defaultExpanded?: boolean;
}

export function ReportProjectSection({
  projectGroup,
  activeLocale,
  timeZone,
  nowIso,
  isLogActive,
  onEdit,
  onDelete,
  defaultExpanded = true,
}: ReportProjectSectionProps) {
  const [open, setOpen] = useState(defaultExpanded);
  const projectId = projectGroup.projectId;

  return (
    <VStack
      gap="sm"
      data-slot="report-project-section"
      data-testid={`report-project-section-${projectId}`}
      className="rounded-2xl border border-border bg-card/80 p-3 shadow-2xs transition-all print:break-inside-avoid"
    >
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="flex flex-col gap-2"
      >
        <CollapsibleTrigger
          data-testid={`report-project-toggle-${projectId}`}
          render={(triggerProps, state) => (
            <Button
              {...triggerProps}
              type="button"
              variant="ghost"
              icon={
                <span className="print:hidden inline-flex items-center">
                  {state.open ? (
                    <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                </span>
              }
              iconPlacement="right"
              className="h-auto w-full justify-between rounded-xl px-2.5 py-2 text-left text-inherit hover:bg-muted/40"
            >
              <HStack align="center" gap="sm" className="min-w-0 flex-1 flex-wrap">
                <FolderKanban className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <Text size="sm" weight="bold" className="text-foreground truncate">
                  {projectGroup.projectName}
                </Text>
                {projectGroup.tags.length > 0 && (
                  <HStack gap="xs" align="center" className="flex-wrap shrink-0">
                    {projectGroup.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        size="xs"
                        className="font-mono text-2xs bg-muted/40 border-border/80"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </HStack>
              <MonoText
                size="xs"
                weight="bold"
                className="text-orange-400 font-mono shrink-0 mr-2"
                data-testid={`report-project-duration-${projectId}`}
              >
                {formatSeconds(projectGroup.durationSeconds)}
              </MonoText>
            </Button>
          )}
        />

        <CollapsibleContent
          keepMounted
          className={cn(
            'flex flex-col gap-2.5 pt-1 pl-1 sm:pl-2',
            !open && 'hidden print:!flex print:!opacity-100'
          )}
        >
          {projectGroup.tasks.map((taskGroup) => (
            <ReportTaskSection
              key={taskGroup.task.id}
              taskGroup={taskGroup}
              project={projectGroup.project}
              activeLocale={activeLocale}
              timeZone={timeZone}
              nowIso={nowIso}
              isLogActive={isLogActive}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </VStack>
  );
}

export default ReportProjectSection;
