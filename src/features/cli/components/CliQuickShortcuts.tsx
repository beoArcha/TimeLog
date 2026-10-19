import React from 'react';
import { Button } from '@components/ui/button';

export interface CliQuickShortcutsProps {
  onExecute: (command: string) => void;
  title: string;
}

export const CliQuickShortcuts: React.FC<CliQuickShortcutsProps> = ({
  onExecute,
  title,
}) => {
  return (
    <div className="border border-border rounded-2xl p-3 flex flex-wrap items-center gap-2 text-[10px] font-mono transition-all bg-muted/40 text-muted-foreground">
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
        id="cmd-stop-btn"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onExecute('stop')}
        className="px-2.5 py-1 rounded transition-all h-auto bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20"
      >
        stop
      </Button>
    </div>
  );
};
