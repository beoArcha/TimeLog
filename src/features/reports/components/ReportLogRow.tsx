import React from 'react';
import { TimeLog } from '@bindings/TimeLog';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Locale } from '@bindings/Locale';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Caption, MonoText } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { useSettingsSafe } from '@common/hooks/useSettings';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import {
  formatCalendarDate,
  formatCalendarTime,
  formatScreenTime,
} from '@features/reports/utils/reportDateUtils';

export interface ReportLogRowProps {
  key?: React.Key;
  log: ClampedTimeLog | TimeLog;
  project?: Project;
  task?: Task;
  isActive: boolean;
  locale?: Locale;
  timeZone?: string;
  nowIso?: string;
  onEdit: (log: ClampedTimeLog | TimeLog) => void;
  onDelete: (log: ClampedTimeLog | TimeLog) => void;
}

export function ReportLogRow({
  log,
  project,
  task,
  isActive,
  locale: propLocale,
  timeZone: propTimeZone,
  nowIso,
  onEdit,
  onDelete,
}: ReportLogRowProps) {
  const { t, locale: contextLocale } = useTranslation('report');
  const activeLocale = propLocale ?? contextLocale;
  const settings = useSettingsSafe();
  const effectiveTimeZone = propTimeZone ?? settings?.resolvedTimezone ?? settings?.timezone;

  const isClamped = 'clampedDurationSeconds' in log;
  let durSeconds: number;
  let isMultiDay = false;
  let isPatch = false;
  let originalDurationSeconds = 0;
  let displayTime = log.startTime;

  if (isClamped) {
    const clamped = log as ClampedTimeLog;
    durSeconds = clamped.clampedDurationSeconds;
    isMultiDay = clamped.isMultiDaySegment;
    isPatch = Boolean(clamped.isPatch);
    originalDurationSeconds = clamped.originalDurationSeconds;
    displayTime = clamped.clampedStartTime || clamped.startTime;
  } else {
    const start = new Date(log.startTime).getTime();
    const fallbackEnd = nowIso ? new Date(nowIso).getTime() : start;
    const end = log.endTime ? new Date(log.endTime).getTime() : fallbackEnd;
    durSeconds = Math.max(0, Math.floor((end - start) / 1000));
  }

  const screenTimeFormatted = formatScreenTime(displayTime, activeLocale, { timeZone: effectiveTimeZone });
  const screenTimeOnly = screenTimeFormatted || 'N/A';

  const printDateFormatted = formatCalendarDate(displayTime, activeLocale);
  const printTimeFormatted = formatCalendarTime(displayTime, activeLocale);
  const printTimeOnly = printTimeFormatted || 'N/A';

  return (
    <div
      data-slot="report-log-row"
      className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 py-1.5 border-b border-border/50 last:border-0 text-xs text-foreground print:break-inside-avoid"
    >
      <div className="truncate flex items-center gap-1.5 flex-wrap">
        <MonoText size="2xs" weight="bold" className="text-indigo-400 shrink-0">
          <span className="print:hidden" data-testid="log-entry-screen-time">[{screenTimeOnly}]</span>
          <span className="hidden print:inline" data-testid="log-entry-print-datetime">
            [{printDateFormatted ? `${printDateFormatted} ` : ''}{printTimeOnly}]
          </span>
        </MonoText>
        <strong className="text-foreground">"{task?.name || 'N/A'}"</strong>
        <Caption as="span">({project?.name})</Caption>

        {isMultiDay && (
          <Badge
            variant="outline"
            size="xs"
            className="font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0"
          >
            {t('MultiDaySegmentBadge')}: {formatSeconds(durSeconds)} / {formatSeconds(originalDurationSeconds)}
          </Badge>
        )}

        {isPatch && (
          <Badge
            variant="outline"
            size="xs"
            className="font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shrink-0"
          >
            {t('PatchBadge')}
          </Badge>
        )}
      </div>

      <HStack gap="xs" className="shrink-0 self-end sm:self-auto items-center">
        <span className="font-mono text-orange-400 font-bold mr-2">
          {formatSeconds(durSeconds)}
        </span>

        {!isPatch && (
          <div className="flex items-center gap-1 print:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={isActive}
              onClick={() => onEdit(log)}
              data-testid={`edit-log-${log.id}`}
              title={isActive ? t('ActiveTimerCannotModify') : t('EditLog')}
              aria-label={isActive ? t('ActiveTimerCannotModify') : t('EditLog')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={isActive}
              onClick={() => onDelete(log)}
              data-testid={`delete-log-${log.id}`}
              title={isActive ? t('ActiveTimerCannotModify') : t('DeleteLog')}
              aria-label={isActive ? t('ActiveTimerCannotModify') : t('DeleteLog')}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </HStack>
    </div>
  );
}

export default ReportLogRow;
