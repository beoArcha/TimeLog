import React from 'react';
import { Plus, Folder, TrendingUp } from 'lucide-react';
import { translate } from '@common/i18n/i18n';
import { GuiKey } from '@common/i18n/keys/GuiKey';
import { getProjectDurationSeconds, formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { getThemeStyles, getScaleStyles } from '@/src/layouts/parts/GuiStyles';
import TaskItem from './components/TaskItem/TaskItem';
import { EngineRouter } from '@common/engine/EngineRouter';

export default function TaskListView({ state, isCondensed }: { state: any; isCondensed: boolean }) {
  const {
    tasks, logs, nowIso, locale, customTranslations, theme,
    selectedProject, rootTasks,
    newTaskName, setNewTaskName, onAddTask
  } = state;

  const [stats, setStats] = React.useState<import('@bindings/ProjectStatistics').ProjectStatistics | null>(null);

  React.useEffect(() => {
    if (!selectedProject?.id) {
      setStats(null);
      return;
    }
    const fetchStats = async () => {
      try {
        const data = await EngineRouter.getInstance().getProjectStatistics(selectedProject.id);
        setStats(data);
      } catch (err) {
        console.error("Failed to load project statistics:", err);
      }
    };
    fetchStats();
  }, [selectedProject?.id, tasks, logs]);

  const th = getThemeStyles(theme);
  const sc = getScaleStyles(state.textAndIconSize || 'medium');

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !selectedProject?.id) return;
    onAddTask(selectedProject.id, newTaskName.trim(), null);
    setNewTaskName('');
  };

  if (!selectedProject) {
    return (
      <div className={`border-2 border-dashed ${sc.roundedMain} p-16 text-center transition-all flex-1 min-h-0 ${theme === 'light'
        ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421]'
        : 'bg-[#FCFAF8]/5 border-white/10'
        }`}>
        <Folder className="w-12 h-12 text-[#9B8C83] mx-auto mb-3" />
        <h3 className={`font-bold ${sc.textTitle} ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>{translate(locale, 'dynamic.selectProject', customTranslations)}</h3>
        <p className={`${sc.textMain} mt-1 ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>Zaznacz projekt w bocznym menu po lewej stronie, aby zacząć zarządzać czasem.</p>
      </div>
    );
  }

  return (
    <div id="project-tasks-sheet" className={`backdrop-blur-md ${sc.roundedMain} ${sc.paddingMain} border shadow-2xl flex flex-col ${sc.gapMain} transition-all duration-300 flex-1 min-h-0 ${theme === 'light'
      ? 'bg-[#FCFAF8] border-[#DFD7CB]'
      : theme === 'high-contrast'
        ? 'bg-black border-2 border-white'
        : 'bg-[#FCFAF8]/5 border-white/10'
      }`}>
      {/* Header with Title and Create Task Input */}
      <div>
        <div className={`flex flex-col ${isCondensed ? 'gap-2 items-start' : 'sm:flex-row sm:items-start justify-between gap-2'} border-b pb-5 mb-5 ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
          }`}>
          <div className={`flex-1 min-w-0 ${isCondensed ? 'w-full' : ''}`}>
            <span className={`${sc.textMain} tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25 ${isCondensed ? 'inline-block mb-2 whitespace-nowrap' : ''}`}>
              {translate(locale, GuiKey.SelectProject, customTranslations)}
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
                  <span className="font-semibold">{translate(locale, 'dynamic.total', customTranslations)}:</span>
                </div>
                <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                  {formatSeconds(getProjectDurationSeconds(selectedProject.id, tasks, logs, nowIso))}
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
                <span className="font-semibold">{translate(locale, 'dynamic.total', customTranslations)}:</span>
              </div>
              <span className={`font-bold ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                {formatSeconds(getProjectDurationSeconds(selectedProject.id, tasks, logs, nowIso))}
              </span>
            </div>
          )}
        </div>

        {stats && !isCondensed && (
          <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
            <div className={`p-4 rounded-2xl border transition-all ${
              theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Duration</p>
              <p className="text-lg font-bold font-mono text-orange-500 mt-1">{formatSeconds(stats.totalDurationSec)}</p>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${
              theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
            }`}>
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Tasks</p>
              <p className="text-lg font-bold text-slate-200 mt-1">{stats.totalTasks}</p>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${
              theme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
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
        <form onSubmit={handleAddTaskSubmit} className={`flex gap-3 ${isCondensed ? 'mt-2' : ''}`}>
          <input
            id="new-task-input"
            type="text"
            placeholder={translate(locale, GuiKey.EnterMainTaskName, customTranslations)}
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
            <Plus className={sc.iconMedium} /> <span className={isCondensed ? 'hidden xs:inline' : ''}>{translate(locale, GuiKey.AddTask, customTranslations)}</span>
          </button>
        </form>
      </div>

      {/* Tree Grid List of Tasks & Subtasks */}
      <div id="tasks-tree-container" className={`flex flex-col ${sc.gapMain} overflow-y-auto pr-1 flex-1 min-h-0`}>
        {rootTasks.length === 0 ? (
          <div className={`text-center py-16 border border-dashed rounded-[2rem] transition-all duration-300 ${theme === 'light'
            ? 'border-[#DFD7CB] text-[#8A7A71] bg-[#F4EFEA]/50'
            : 'border-white/10 text-[#9B8C83]'
            }`}>
            <Folder className="w-8 h-8 mx-auto text-[#9B8C83] mb-2" />
            <p className="text-sm font-semibold">{translate(locale, GuiKey.NoTasksInProject, customTranslations)}</p>
            <p className="text-xs text-[#8A7A71] mt-1">
              {translate(locale, 'dynamic.createAMainProjectTaskAboveThe', customTranslations)}
            </p>
          </div>
        ) : (
          rootTasks.map((rootTask: any) => (
            <TaskItem
              key={rootTask.id}
              rootTask={rootTask}
              state={state}
              isCondensed={isCondensed}
              th={th}
              sc={sc}
            />
          ))
        )}
      </div>
    </div>
  );
}
