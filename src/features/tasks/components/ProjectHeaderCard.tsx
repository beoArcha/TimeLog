import React from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { Project } from '@bindings/Project';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { Locale } from '@bindings/Locale';

import { StatsSkeleton } from '@components/ui/Skeletons';
import { getScaleStyles } from '@/src/layouts/parts/LayoutStyles';

interface ProjectHeaderCardProps {
  selectedProject: Project;
  projectDurationSeconds: number;
  isCondensed: boolean;
  theme: string;
  locale: Locale;
  customTranslations: Record<string, unknown>;
  sc: ReturnType<typeof getScaleStyles>;
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
  locale,
  customTranslations,
  sc,
  stats,
  loading,
  newTaskName,
  setNewTaskName,
  onAddTaskSubmit
}: ProjectHeaderCardProps) {
  return (
    <div>
      <div className={`flex flex-col ${isCondensed ? 'gap-2 items-start' : 'sm:flex-row sm:items-start justify-between gap-2'} border-b pb-5 mb-5 ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
        }`}>
        <div className={`flex-1 min-w-0 ${isCondensed ? 'w-full' : ''}`}>
          <span className={`${sc.textMain} tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25 ${isCondensed ? 'inline-block mb-2 whitespace-nowrap' : ''}`}>
            {translate(locale, 'project', 'SelectProject', customTranslations)}
          </span>
          <h2 className={`font-sans font-bold mt-1.5 flex items-center ${sc.gapMain} ${sc.textGiant} ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
            }`}>
            <span className={`${sc.iconMedium} rounded-full bg-[var(--project-color,orange)] shrink-0 shadow-md`} style={{ backgroundColor: selectedProject.color ? `var(--tw-color-${selectedProject.color}-500)` : undefined }} />
            <span className="truncate" title={selectedProject.name}>{selectedProject.name}</span>
          </h2>

          {isCondensed && (
            <div className={`mt-3 font-mono ${sc.textMain} border px-3 py-1.5 rounded-2xl flex flex-wrap items-center gap-2 w-fit ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]' : 'bg-[#FCFAF8]/5 border-white/10 text-slate-300'
              }`}>
              <div className="flex items-center gap-2">
                <TrendingUp className={`${sc.iconSmall} text-orange-400`} />
                <span className="font-semibold">{translate(locale, 'common', 'Total', customTranslations)}:</span>
              </div>
              <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                {formatSeconds(projectDurationSeconds)}
              </span>
            </div>
          )}
        </div>

        {!isCondensed && (
          <div className={`text-left sm:text-right font-mono ${sc.textTitle} border ${sc.paddingSection} ${sc.roundedSection} flex flex-wrap items-center gap-2 transition-all w-fit ${theme === 'light'
            ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]'
            : theme === 'high-contrast'
              ? 'bg-black border-white text-white'
              : 'bg-[#FCFAF8]/5 border-white/10 text-slate-300'
            }`}>
            <div className="flex items-center gap-2">
              <TrendingUp className={`${sc.iconMedium} text-orange-400`} />
              <span className="font-semibold">{translate(locale, 'common', 'Total', customTranslations)}:</span>
            </div>
            <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
              {formatSeconds(projectDurationSeconds)}
            </span>
          </div>
        )}
      </div>

      {loading && !isCondensed && (
        <div data-testid="stats-skeleton-grid" className="grid grid-cols-3 gap-4 mb-6">
          <div className={`rounded-2xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <StatsSkeleton />
          </div>
          <div className={`rounded-2xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <StatsSkeleton />
          </div>
          <div className={`rounded-2xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <StatsSkeleton />
          </div>
        </div>
      )}

      {stats && !loading && !isCondensed && (
        <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
          <div className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Duration</p>
            <p className="text-lg font-bold font-mono text-orange-500 mt-1">{formatSeconds(Number(stats.totalDurationSec))}</p>
          </div>
          <div className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Tasks</p>
            <p className="text-lg font-bold text-slate-200 mt-1">{stats.totalTasks}</p>
          </div>
          <div className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Completed Tasks</p>
            <p className="text-lg font-bold text-slate-200 mt-1 flex items-center justify-between">
              <span>{stats.completedTasks}</span>
              {stats.totalTasks > 0 && (
                <span className="text-xs text-emerald-450">
                  {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Add Root Task Form */}
      <form onSubmit={onAddTaskSubmit} className={`flex gap-3 ${isCondensed ? 'mt-2' : ''}`}>
        <input
          id="new-task-input"
          type="text"
          placeholder={translate(locale, 'task', 'EnterMainTaskName', customTranslations)}
          value={newTaskName}
          onChange={e => setNewTaskName(e.target.value)}
          className={`flex-1 px-4 ${sc.inputPy} border ${sc.roundedMain} ${sc.textMain} focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all ${theme === 'light'
            ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
            : 'bg-[#FCFAF8]/5 border-white/10 text-white placeholder-[#9B8C83]'
            }`}
        />
        <button
          id="add-task-btn"
          type="submit"
          className={`bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-semibold ${sc.roundedMain} px-5 sm:px-6 py-3 sm:py-3.5 ${sc.textMain} flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0`}
        >
          <Plus className={sc.iconMedium} /> <span className={isCondensed ? 'hidden xs:inline' : ''}>{translate(locale, 'task', 'AddTask', customTranslations)}</span>
        </button>
      </form>
    </div>
  );
}
