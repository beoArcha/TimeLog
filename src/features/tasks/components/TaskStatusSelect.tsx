import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { TaskStatus } from '@bindings/TaskStatus';
import { useTranslation } from '@common/i18n/translator';
import { InlineCluster } from '@components/ui/stack';
import { badgeVariants } from '@components/ui/badge-variants';
import { cn } from '@/lib/utils';

const STATUS_BADGE_STYLE_MAP: Record<TaskStatus, string> = {
  Done: badgeVariants({ variant: 'success' }),
  InProgress: badgeVariants({ variant: 'outline' }),
  Blocked: badgeVariants({ variant: 'destructive' }),
  Todo: badgeVariants({ variant: 'secondary' }),
};

export interface TaskStatusSelectProps {
  status: TaskStatus | null;
  onStatusChange: (status: TaskStatus) => void;
  size?: 'sm' | 'xs';
  ariaLabel?: string;
}

export function TaskStatusSelect({
  status,
  onStatusChange,
  size = 'sm',
  ariaLabel = 'Task status',
}: TaskStatusSelectProps) {
  const { t } = useTranslation('task');
  const currentStatus: TaskStatus = status || 'Todo';
  const sizeClasses = size === 'xs' ? 'h-5 text-xs px-1.5 py-0.5' : 'h-6 text-xs px-2 py-0.5';

  const statusLabels: Record<TaskStatus, string> = {
    Todo: t('StatusTodo'),
    InProgress: t('StatusInProgress'),
    Done: t('StatusDone'),
    Blocked: t('StatusBlocked'),
  };

  return (
    <InlineCluster as="span" onClick={(e) => e.stopPropagation()} className="inline-flex shrink-0">
      <Select
        value={currentStatus}
        onValueChange={(val) => {
          if (val) {
            onStatusChange(val as TaskStatus);
          }
        }}
      >
        <SelectTrigger
          className={cn(
            sizeClasses,
            'font-bold rounded border font-mono shrink-0 transition-all',
            STATUS_BADGE_STYLE_MAP[currentStatus] ?? STATUS_BADGE_STYLE_MAP.Todo
          )}
          aria-label={ariaLabel}
        >
          <SelectValue>{statusLabels[currentStatus]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todo" className="text-xs">{statusLabels.Todo}</SelectItem>
          <SelectItem value="InProgress" className="text-xs text-foreground">{statusLabels.InProgress}</SelectItem>
          <SelectItem value="Done" className="text-xs text-success">{statusLabels.Done}</SelectItem>
          <SelectItem value="Blocked" className="text-xs text-destructive">{statusLabels.Blocked}</SelectItem>
        </SelectContent>
      </Select>
    </InlineCluster>
  );
}
