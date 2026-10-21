import React from 'react';
import { Plus, TrendingUp, Clock, ListTodo, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { Project } from '@bindings/Project';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { StatsSkeleton } from '@components/ui/Skeletons';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Heading } from '@components/ui/typography';
import { Input } from '@components/ui/input';

interface ProjectHeaderCardProps {
  selectedProject: Project;
  projectDurationSeconds: number;
  isCondensed: boolean;
  theme?: string;
  stats: ProjectStatistics | null;
  loading: boolean;
  newTaskName: string;
  setNewTaskName: (name: string) => void;
  onAddTaskSubmit: (e: React.FormEvent) => void;
}

export default function ProjectHeaderCard({
  selectedProject,
  projectDurationSeconds,
  isCondensed,
  stats,
  loading,
  newTaskName,
  setNewTaskName,
  onAddTaskSubmit
}: ProjectHeaderCardProps) {
  const { t: tProject } = useTranslation('project');
  const { t: tCommon } = useTranslation('common');
  const { t: tTask } = useTranslation('task');

  return (
    <div>
      <div className={`flex flex-col ${isCondensed ? 'gap-2 items-start' : 'sm:flex-row sm:items-start justify-between gap-2'} border-b pb-3 mb-3 border-border`}>
        <div className={`flex-1 min-w-0 ${isCondensed ? 'w-full' : ''}`}>
          {!isCondensed && (
            <Badge variant="orange" size="sm" className="tracking-wider uppercase inline-block mb-1.5 whitespace-nowrap">
              {tProject('SelectProject')}
            </Badge>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Heading level={2} className="font-sans font-bold flex items-center gap-2 text-title text-foreground">
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--project-color,orange)] shrink-0 shadow-md" style={{ backgroundColor: selectedProject.color ? `var(--tw-color-${selectedProject.color}-500)` : undefined }} />
              <span className="truncate" title={selectedProject.name}>{selectedProject.name}</span>
            </Heading>

            {isCondensed && (
              <div className="font-mono text-xs border border-border px-2.5 py-1 rounded-xl flex items-center gap-1.5 bg-muted/40 text-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="font-semibold">{tCommon('Total')}:</span>
                <span className="font-bold text-foreground">
                  {formatSeconds(projectDurationSeconds)}
                </span>
              </div>
            )}
          </div>
        </div>

        {!isCondensed && (
          <div className="text-left sm:text-right font-mono text-main border border-border padding-section rounded-section flex flex-wrap items-center gap-2 transition-all w-fit bg-muted/40 text-foreground">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="icon-medium text-orange-400" />
              <span className="font-semibold">{tCommon('Total')}:</span>
            </div>
            <span className="font-bold text-foreground">
              {formatSeconds(projectDurationSeconds)}
            </span>
          </div>
        )}
      </div>

      {loading && !isCondensed && (
        <div data-testid="stats-skeleton-grid" className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-3">
          <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-muted/40 transition-all">
            <StatsSkeleton />
          </div>
          <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-muted/40 transition-all">
            <StatsSkeleton />
          </div>
          <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-muted/40 transition-all">
            <StatsSkeleton />
          </div>
        </div>
      )}

      {stats && !loading && !isCondensed && (
        <div data-testid="stats-cards-grid" className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-3">
          <div className="p-3 sm:p-3.5 rounded-xl border border-border shadow-xs transition-all flex flex-col justify-between bg-card text-card-foreground">
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider truncate text-muted-foreground">
                {tProject('TotalDuration')}
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono text-orange-500 tracking-tight">
              {formatSeconds(Number(stats.totalDurationSec ?? (stats as unknown as { totalDurationSeconds?: number }).totalDurationSeconds ?? 0) || 0)}
            </p>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-border shadow-xs transition-all flex flex-col justify-between bg-card text-card-foreground">
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <ListTodo className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider truncate text-muted-foreground">
                {tProject('TotalTasks')}
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              {stats.totalTasks}
            </p>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl border border-border shadow-xs transition-all flex flex-col justify-between bg-card text-card-foreground">
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wider truncate text-muted-foreground">
                {tProject('CompletedTasks')}
              </p>
            </div>
            <div className="text-lg sm:text-xl font-bold flex items-center justify-between gap-1.5 text-foreground">
              <span>{stats.completedTasks}</span>
              {stats.totalTasks > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onAddTaskSubmit} className={`flex gap-2 ${isCondensed ? 'mt-2' : ''}`}>
        <Input
          id="new-task-input"
          type="text"
          placeholder={tTask('EnterMainTaskName')}
          value={newTaskName}
          onChange={e => setNewTaskName(e.target.value)}
          className="flex-1 px-3 py-2 sm:py-2.5 min-h-[40px] text-main"
        />
        <Button
          id="add-task-btn"
          type="submit"
          variant="accent"
          className="rounded-main px-4 py-2 sm:py-2.5 min-h-[40px] text-main flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="icon-small" /> <span className={isCondensed ? 'hidden xs:inline' : ''}>{tTask('AddTask')}</span>
        </Button>
      </form>
    </div>
  );
}
