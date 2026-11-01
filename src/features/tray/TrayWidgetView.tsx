import React from 'react';
import { AppWindow, Layers } from 'lucide-react';
import { AnimatedFade } from '@components/AnimatedFade';
import { AnimatedCard } from '@components/AnimatedCard';
import { useTranslation } from '@common/i18n/translator';
import { useData } from '@common/hooks/DataContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Heading, Overline, Text, Caption } from '@components/ui/typography';

interface TrayWidgetProps {
  onRestore: () => void;
  onStopAll: () => void;
  showToast: (msg: string) => void;
}

const PROJECT_COLOR_MAP: Record<string, string> = {
  rose: 'bg-rose-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
};

export default function TrayWidgetView({ onRestore, onStopAll }: TrayWidgetProps) {
  const { projects, tasks, logs, computedMetrics } = useData();
  const { nowIso } = useWindowShell();

  const { t: tEngine } = useTranslation('engine');
  const { t: tTimer } = useTranslation('timer');

  const activeRunningLogs = logs.filter(l => l.endTime === null);

  return (
    <AnimatedFade
      id="simulated-tray-widget"
      key="tray-state"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-auto padding-main"
    >
      <AnimatedCard hoverable={false} className="rounded-main padding-main shadow-3xl w-full text-center flex flex-col items-center gap-main relative overflow-hidden group border border-border bg-card text-card-foreground transition-all duration-300">
        <div className="ambient-gradients absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 via-rose-500 to-indigo-500" />

        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground shadow-2xl flex items-center justify-center transform hover:rotate-6 transition-transform">
            <Layers className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-success border-2 border-background"></span>
          </span>
        </div>

        <div>
          <Heading level={1} className="font-heading font-extrabold text-2xl tracking-tight flex items-center gap-2 justify-center text-foreground">
            OxyFlow Engine
            <Badge variant="success" size="sm" className="font-mono tracking-wider uppercase">
              {tEngine('EngineRunningBackground')}
            </Badge>
          </Heading>
          <Text size="sm" variant="muted" className="mt-2 max-w-md font-sans">
            {tEngine('TrayDescription')}
          </Text>
          <div className="text-xs px-4 py-2 rounded-xl font-mono inline-block mt-4 border border-border bg-muted/40 text-foreground">
            {tEngine('DaemonEnginePid')} <strong className="text-primary font-bold">8421</strong> {tEngine('SqliteThread')}
          </div>
        </div>

        <div className="w-full rounded-2xl p-4 text-left border border-border bg-muted/20 max-h-[180px] overflow-y-auto">
          <Overline className="mb-3 border-b border-border pb-1.5 block">
            {tEngine('ActiveMeasuringThreads')} ({activeRunningLogs.length})
          </Overline>
          {activeRunningLogs.length === 0 ? (
            <Caption variant="muted" className="italic text-center py-2">
              {tTimer('NoActiveTimers')}
            </Caption>
          ) : (
            <div className="flex flex-col gap-2">
              {activeRunningLogs.map(l => {
                const proj = projects.find(p => p.id === l.projectId);
                const taskObj = tasks.find(t => t.id === l.taskId);
                const start = new Date(l.startTime).getTime();
                const taskMetric = computedMetrics?.tasks?.[l.taskId];
                const fallbackElapsed = nowIso ? Math.max(0, Math.floor((new Date(nowIso).getTime() - start) / 1000)) : 0;
                const elapsed = taskMetric ? taskMetric.selfElapsedSeconds : fallbackElapsed;

                const hrs = Math.floor(elapsed / 3600);
                const mins = Math.floor((elapsed % 3600) / 60);
                const secs = elapsed % 60;
                const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

                return (
                  <div key={l.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-border bg-card text-card-foreground">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${PROJECT_COLOR_MAP[proj?.color || 'rose'] ?? 'bg-rose-500'} shadow-md`} />
                      <span className="font-semibold truncate max-w-[140px] sm:max-w-xs">{taskObj?.name}</span>
                    </div>
                    <span className="font-mono text-success font-bold bg-success/15 px-2.5 py-1 rounded-md">
                      {timeStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            id="tray-restore-btn"
            variant="accent"
            onClick={onRestore}
            className="flex-1 font-semibold py-3 rounded-2xl text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] h-auto"
          >
            <AppWindow className="w-4.5 h-4.5" />
            {tEngine('MaximizeAndRestore')}
          </Button>
          <Button
            id="tray-kill-all-btn"
            onClick={onStopAll}
            disabled={activeRunningLogs.length === 0}
            variant={activeRunningLogs.length === 0 ? 'outline' : 'destructive'}
            className="py-3 px-6 rounded-2xl text-sm font-semibold transition-all h-auto cursor-pointer"
          >
            {tEngine('PauseAllProcesses')}
          </Button>
        </div>
      </AnimatedCard>
    </AnimatedFade>
  );
}
