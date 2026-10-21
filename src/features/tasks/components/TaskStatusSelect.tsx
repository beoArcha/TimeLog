import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { TaskStatus } from '@bindings/TaskStatus';

const STATUS_BADGE_STYLE_MAP: Record<TaskStatus, string> = {
  Done: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  InProgress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Blocked: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  Todo: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
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
  const currentStatus: TaskStatus = status || 'Todo';
  const sizeClasses = size === 'xs' ? 'h-5 text-xs px-1.5 py-0.5' : 'h-6 text-xs px-2 py-0.5';

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={currentStatus}
        onValueChange={(val) => {
          if (val) {
            onStatusChange(val as TaskStatus);
          }
        }}
      >
        <SelectTrigger
          className={`${sizeClasses} font-bold rounded border font-mono shrink-0 transition-all ${
            STATUS_BADGE_STYLE_MAP[currentStatus] ?? STATUS_BADGE_STYLE_MAP.Todo
          }`}
          aria-label={ariaLabel}
        >
          <SelectValue>{currentStatus}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todo" className="text-xs">TODO</SelectItem>
          <SelectItem value="InProgress" className="text-xs text-blue-400">In Progress</SelectItem>
          <SelectItem value="Done" className="text-xs text-emerald-400">Done</SelectItem>
          <SelectItem value="Blocked" className="text-xs text-rose-450">Blocked</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
