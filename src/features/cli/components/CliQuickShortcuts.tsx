import React from 'react';
import { Button } from '@components/ui/button';

export interface CliQuickShortcutsProps {
  onExecute: (command: string) => void;
  onSetInput?: (text: string) => void;
  title: string;
}

export const CliQuickShortcuts: React.FC<CliQuickShortcutsProps> = ({
  onExecute,
  onSetInput,
  title,
}) => {
  const handleTaskAdd = () => {
    if (onSetInput) {
      onSetInput('addtask ');
    } else {
      onExecute('task add');
    }
  };

  return (
    <div className="border border-border rounded-2xl p-3 flex flex-wrap items-center gap-2 text-xs font-mono transition-all bg-muted/40 text-muted-foreground">
      <span className="font-bold text-foreground">{title}</span>
      <Button
        id="cmd-project-list-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('projects')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-primary border border-border"
      >
        projects
      </Button>
      <Button
        id="cmd-status-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('status')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-primary border border-border"
      >
        status
      </Button>
      <Button
        id="cmd-task-add-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTaskAdd}
        className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-primary border border-border"
      >
        task add
      </Button>
      <Button
        id="cmd-logs-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('logs')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-primary border border-border"
      >
        logs
      </Button>
      <Button
        id="cmd-pause-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('pause')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20"
      >
        pause
      </Button>
      <Button
        id="cmd-break-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('break 5m')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20"
      >
        break 5m
      </Button>
      <Button
        id="cmd-stop-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('stop')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20"
      >
        stop
      </Button>
      <Button
        id="cmd-help-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('help')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-muted-foreground border border-border"
      >
        help
      </Button>
      <Button
        id="cmd-clear-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('clear')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-card hover:bg-muted text-muted-foreground border border-border"
      >
        clear
      </Button>
    </div>
  );
};
