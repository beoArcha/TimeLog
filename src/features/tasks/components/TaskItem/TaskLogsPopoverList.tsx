import React from 'react';
import { Button } from '@components/ui/button';
import { Text, Caption, MonoText } from '@components/ui/typography';
import { VStack, HStack } from '@components/ui/stack';
import { Badge } from '@components/ui/badge';
import { TimeLog } from '@bindings/TimeLog';
import { formatTime, formatDate } from '@common/utils/timeFormat';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { useTranslation } from '@common/i18n/translator';
import { calculateLogDuration } from './taskLogsUtils';

export interface TaskLogsPopoverListProps {
  taskId: string;
  matchingLogs: TimeLog[];
  sortedLogs: TimeLog[];
  timeZone?: string;
  getLogTaskName: (log: TimeLog) => string;
  onSelectLog: (log: TimeLog) => void;
}

export function TaskLogsPopoverList({
  taskId,
  matchingLogs,
  sortedLogs,
  timeZone,
  getLogTaskName,
  onSelectLog,
}: TaskLogsPopoverListProps) {
  const { t: tTask, locale } = useTranslation('task');

  return (
    <VStack gap="xs" className="w-full">
      <HStack justify="between" align="center" className="px-2 py-1 border-b border-border/50">
        <Text size="xs" weight="semibold" className="text-foreground">
          {tTask('TimeLogsHistory')}
        </Text>
        <Caption size="2xs" className="text-muted-foreground font-mono">
          {matchingLogs.length}
        </Caption>
      </HStack>

      {sortedLogs.length === 0 ? (
        <Caption size="xs" className="text-muted-foreground text-center py-4">
          {tTask('NoLogs')}
        </Caption>
      ) : (
        <VStack gap="2xs" className="w-full">
          {sortedLogs.map((log) => {
            const durSeconds = calculateLogDuration(log);
            const isSubtaskLog = log.taskId !== taskId;
            const formattedStart = formatTime(log.startTime, timeZone, locale);
            const formattedEnd = log.endTime ? formatTime(log.endTime, timeZone, locale) : '...';

            return (
              <Button
                key={log.id}
                id={`log-item-${log.id}`}
                data-testid={`log-item-${log.id}`}
                type="button"
                variant="ghost"
                onClick={() => onSelectLog(log)}
                className="w-full h-auto p-2 rounded-xl text-left justify-start items-center hover:bg-muted/80 transition-colors cursor-pointer"
              >
                <VStack as="span" gap="2xs" className="w-full min-w-0">
                  <HStack as="span" justify="between" align="center" className="w-full">
                    <MonoText size="2xs" weight="bold" className="text-primary truncate">
                      {formattedStart} - {formattedEnd}
                    </MonoText>
                    <MonoText size="2xs" weight="bold" className="text-orange-400 shrink-0">
                      {formatSeconds(durSeconds)}
                    </MonoText>
                  </HStack>

                  <HStack as="span" justify="between" align="center" className="w-full text-xs text-muted-foreground">
                    {isSubtaskLog ? (
                      <Badge variant="outline" size="xs" className="truncate max-w-[140px]">
                        {getLogTaskName(log)}
                      </Badge>
                    ) : (
                      <Caption as="span" size="2xs" className="text-muted-foreground truncate">
                        {formatDate(log.startTime, timeZone, locale)}
                      </Caption>
                    )}
                    {log.note && (
                      <Caption as="span" size="2xs" className="truncate text-muted-foreground/80 italic ml-auto max-w-[120px]">
                        {log.note}
                      </Caption>
                    )}
                  </HStack>
                </VStack>
              </Button>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
}
