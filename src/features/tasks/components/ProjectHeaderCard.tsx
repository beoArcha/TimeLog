import React from 'react';
import { Plus, TrendingUp, Clock, ListTodo, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { Project } from '@bindings/Project';
import { ProjectStatistics } from '@bindings/ProjectStatistics';

import { StatsSkeleton } from '@components/ui/Skeletons';

interface ProjectHeaderCardProps {
  selectedProject: Project;
  projectDurationSeconds: number;
  isCondensed: boolean;
  theme: string;
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
  theme,
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
      <div className={`flex flex-col ${isCondensed ? 'gap-2 items-start' : 'sm:flex-row sm:items-start justify-between gap-2'} border-b pb-3 mb-3 ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
        }`}>
        <div className={`flex-1 min-w-0 ${isCondensed ? 'w-full' : ''}`}>
          {!isCondensed && (
            <span className="text-main tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-2.5 py-0.5 rounded-full font-bold uppercase border border-orange-500/25 inline-block mb-1.5 whitespace-nowrap">
              {tProject('SelectProject')}
            </span>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className={`font-sans font-bold flex items-center gap-2 text-title ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
              <span className="w-3.5 h-3.5 rounded-full bg-[var(--project-color,orange)] shrink-0 shadow-md" style={{ backgroundColor: selectedProject.color ? `var(--tw-color-${selectedProject.color}-500)` : undefined }} />
              <span className="truncate" title={selectedProject.name}>{selectedProject.name}</span>
            </h2>

            {isCondensed && (
              <div className={`font-mono text-xs border px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]' : 'bg-[#FCFAF8]/5 border-white/10 text-slate-300'}`}>
                <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="font-semibold">{tCommon('Total')}:</span>
                <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                  {formatSeconds(projectDurationSeconds)}
                </span>
              </div>
            )}
          </div>
        </div>

        {!isCondensed && (
          <div className={`text-left sm:text-right font-mono text-main border padding-section rounded-section flex flex-wrap items-center gap-2 transition-all w-fit ${theme === 'light'
            ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]'
            : theme === 'high-contrast'
              ? 'bg-black border-white text-white'
              : 'bg-[#FCFAF8]/5 border-white/10 text-slate-300'
            }`}>
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`icon-medium text-orange-400`} />
              <span className="font-semibold">{tCommon('Total')}:</span>
            </div>
            <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
              {formatSeconds(projectDurationSeconds)}
            </span>
          </div>
        )}
      </div>

      {loading && !isCondensed && (
        <div data-testid="stats-skeleton-grid" className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-3">
          <div className={`p-3 sm:p-3.5 rounded-xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <StatsSkeleton />
          </div>
          <div className={`p-3 sm:p-3.5 rounded-xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <StatsSkeleton />
          </div>
          <div className={`p-3 sm:p-3.5 rounded-xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <StatsSkeleton />
          </div>
        </div>
      )}

      {stats && !loading && !isCondensed && (
        <div data-testid="stats-cards-grid" className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-3">
          <div className={`p-3 sm:p-3.5 rounded-xl border shadow-xs transition-all flex flex-col justify-between ${theme === 'light'
            ? 'bg-white/90 border-[#DFD7CB] text-[#2C2421]'
            : theme === 'high-contrast'
              ? 'bg-black border-2 border-white text-white'
              : 'bg-black/35 border-white/15 text-slate-100'
            }`}>
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <p className={`text-xs font-semibold uppercase tracking-wider truncate ${theme === 'light' ? 'text-[#5A4A42]' : theme === 'high-contrast' ? 'text-white' : 'text-slate-300'}`}>
                {tProject('TotalDuration')}
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold font-mono text-orange-500 tracking-tight">
              {formatSeconds(Number(stats.totalDurationSec ?? (stats as unknown as { totalDurationSeconds?: number }).totalDurationSeconds ?? 0) || 0)}
            </p>
          </div>

          <div className={`p-3 sm:p-3.5 rounded-xl border shadow-xs transition-all flex flex-col justify-between ${theme === 'light'
            ? 'bg-white/90 border-[#DFD7CB] text-[#2C2421]'
            : theme === 'high-contrast'
              ? 'bg-black border-2 border-white text-white'
              : 'bg-black/35 border-white/15 text-slate-100'
            }`}>
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <ListTodo className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <p className={`text-xs font-semibold uppercase tracking-wider truncate ${theme === 'light' ? 'text-[#5A4A42]' : theme === 'high-contrast' ? 'text-white' : 'text-slate-300'}`}>
                {tProject('TotalTasks')}
              </p>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
              {stats.totalTasks}
            </p>
          </div>

          <div className={`p-3 sm:p-3.5 rounded-xl border shadow-xs transition-all flex flex-col justify-between ${theme === 'light'
            ? 'bg-white/90 border-[#DFD7CB] text-[#2C2421]'
            : theme === 'high-contrast'
              ? 'bg-black border-2 border-white text-white'
              : 'bg-black/35 border-white/15 text-slate-100'
            }`}>
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className={`text-xs font-semibold uppercase tracking-wider truncate ${theme === 'light' ? 'text-[#5A4A42]' : theme === 'high-contrast' ? 'text-white' : 'text-slate-300'}`}>
                {tProject('CompletedTasks')}
              </p>
            </div>
            <div className={`text-lg sm:text-xl font-bold flex items-center justify-between gap-1.5 ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
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


      {/* Add Root Task Form */}
      <form onSubmit={onAddTaskSubmit} className={`flex gap-2 ${isCondensed ? 'mt-2' : ''}`}>
        <input
          id="new-task-input"
          type="text"
          placeholder={tTask('EnterMainTaskName')}
          value={newTaskName}
          onChange={e => setNewTaskName(e.target.value)}
          className={`flex-1 px-3 py-2 sm:py-2.5 min-h-[40px] border rounded-main text-main focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${theme === 'light'
            ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
            : 'bg-[#FCFAF8]/5 border-white/10 text-white placeholder-[#9B8C83]'
            }`}
        />
        <button
          id="add-task-btn"
          type="submit"
          className={`bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-semibold rounded-main px-4 py-2 sm:py-2.5 min-h-[40px] text-main flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0`}
        >
          <Plus className="icon-small" /> <span className={isCondensed ? 'hidden xs:inline' : ''}>{tTask('AddTask')}</span>
        </button>
      </form>
    </div>
  );
}
