import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckSquare, Layers } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import { Project } from '@bindings/Project';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { TimeLog } from '@bindings/TimeLog';
import { GroupedTask } from '../utils/grouping';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@components/ui/collapsible';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { HStack, VStack } from '@components/ui/stack';
import { MonoText, Text, Caption } from '@components/ui/typography';
import { cn } from '@/lib/utils';
import ReportLogRow from './ReportLogRow';

export interface ReportTaskSectionProps {
  key?: React.Key;
  taskGroup: GroupedTask;
  project?: Project;
  activeLocale?: Locale;
  timeZone?: string;
  nowIso?: string;
  isLogActive: (log: ClampedTimeLog | TimeLog) => boolean;
  onEdit: (log: ClampedTimeLog | TimeLog) => void;
  onDelete: (log: ClampedTimeLog | TimeLog) => void;
  defaultExpanded?: boolean;
}

export function ReportTaskSection({
  taskGroup,
  project,
  activeLocale,
  timeZone,
  nowIso,
  isLogActive,
  onEdit,
  onDelete,
  defaultExpanded = true,
}: ReportTaskSectionProps) {
  const { t } = useTranslation('report');
  const [open, setOpen] = useState(defaultExpanded);

  const hasSubtasks = taskGroup.subtasks.length > 0;
  const taskId = taskGroup.task.id;

  if (hasSubtasks) {
    return (
      <VStack
        gap="xs"
        data-slot="report-task-section"
        data-testid={`report-task-section-${taskId}`}
        className="rounded-xl border border-border/50 bg-card/60 p-2 text-xs"
      >
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          className="flex flex-col gap-2"
        >
          <CollapsibleTrigger
            data-testid={`report-task-toggle-${taskId}`}
            render={(triggerProps, state) => (
              <Button
                {...triggerProps}
                type="button"
                variant="ghost"
                icon={
                  <span className="print:hidden inline-flex items-center">
                    {state.open ? (
                      <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                  </span>
                }
                iconPlacement="right"
                className="h-auto w-full justify-between rounded-lg px-2 py-1.5 text-left text-inherit hover:bg-muted/40"
              >
                <HStack align="center" gap="xs" className="min-w-0 flex-1">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <Text size="xs" weight="semibold" className="text-foreground truncate">
                    {taskGroup.task.name}
                  </Text>
                  <Badge variant="secondary" size="xs" className="font-mono text-2xs shrink-0">
                    {taskGroup.subtasks.length} {t('Subtasks')}
                  </Badge>
                </HStack>
                <MonoText
                  size="2xs"
                  weight="bold"
                  className="text-orange-400 font-mono shrink-0 mr-2"
                  data-testid={`report-task-duration-${taskId}`}
                >
                  {formatSeconds(taskGroup.durationSeconds)}
                </MonoText>
              </Button>
            )}
          />

          <CollapsibleContent
            keepMounted
            className={cn(
              'flex flex-col gap-2 pl-3 sm:pl-4 border-l border-border/40 ml-1',
              !open && 'hidden print:!flex print:!opacity-100'
            )}
          >
            {taskGroup.directLogs.length > 0 && (
              <VStack gap="xs" className="pt-1">
                <Caption size="2xs" className="uppercase tracking-wider text-muted-foreground font-mono font-bold">
                  {t('DirectLogs')} ({taskGroup.directLogs.length})
                </Caption>
                {taskGroup.directLogs.map((log) => (
                  <ReportLogRow
                    key={log.id}
                    log={log}
                    project={project}
                    task={taskGroup.task}
                    isActive={isLogActive(log)}
                    locale={activeLocale}
                    timeZone={timeZone}
                    nowIso={nowIso}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </VStack>
            )}

            {taskGroup.subtasks.map((subtaskGroup) => (
              <VStack
                key={subtaskGroup.subtask.id}
                gap="xs"
                data-slot="report-subtask-section"
                data-testid={`report-subtask-section-${subtaskGroup.subtask.id}`}
                className="rounded-lg bg-muted/20 border border-border/30 p-2"
              >
                <HStack justify="between" align="center" className="text-xs">
                  <HStack gap="xs" align="center" className="min-w-0">
                    <span className="text-muted-foreground font-mono shrink-0" aria-hidden="true">↳</span>
                    <Text size="xs" weight="medium" className="text-foreground truncate">
                      {subtaskGroup.subtask.name}
                    </Text>
                  </HStack>
                  <MonoText
                    size="2xs"
                    weight="semibold"
                    className="text-orange-400 font-mono shrink-0"
                    data-testid={`report-subtask-duration-${subtaskGroup.subtask.id}`}
                  >
                    {formatSeconds(subtaskGroup.durationSeconds)}
                  </MonoText>
                </HStack>

                <VStack gap="xs" className="pl-2">
                  {subtaskGroup.logs.map((log) => (
                    <ReportLogRow
                      key={log.id}
                      log={log}
                      project={project}
                      task={subtaskGroup.subtask}
                      isActive={isLogActive(log)}
                      locale={activeLocale}
                      timeZone={timeZone}
                      nowIso={nowIso}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </VStack>
              </VStack>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </VStack>
    );
  }

  // Direct visibility without subtasks
  return (
    <VStack
      gap="xs"
      data-slot="report-task-section"
      data-testid={`report-task-section-${taskId}`}
      className="rounded-xl border border-border/40 bg-card/40 p-2 text-xs"
    >
      <HStack justify="between" align="center" className="py-1 px-2 rounded-md bg-muted/20 text-xs">
        <HStack gap="xs" align="center" className="min-w-0">
          <CheckSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <Text size="xs" weight="semibold" className="text-foreground truncate">
            {taskGroup.task.name}
          </Text>
        </HStack>
        <MonoText
          size="2xs"
          weight="bold"
          className="text-orange-400 font-mono shrink-0"
          data-testid={`report-task-duration-${taskId}`}
        >
          {formatSeconds(taskGroup.durationSeconds)}
        </MonoText>
      </HStack>

      <VStack gap="xs" className="pl-2">
        {taskGroup.directLogs.map((log) => (
          <ReportLogRow
            key={log.id}
            log={log}
            project={project}
            task={taskGroup.task}
            isActive={isLogActive(log)}
            locale={activeLocale}
            timeZone={timeZone}
            nowIso={nowIso}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </VStack>
    </VStack>
  );
}

export default ReportTaskSection;
