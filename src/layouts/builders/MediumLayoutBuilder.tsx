import React, { useState } from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import type { LayoutRouterProps } from '../types/LayoutCommonProps';
import ActiveTimerBanner from '../parts/ActiveTimerBanner';
import TaskListView from '@features/tasks/TaskListView';
import ReportView from '@features/reports/ReportView';
import DbInspector from '@features/db-explorer/components/DbInspector';
import SettingsTab from '@features/settings/SettingsTab';
import { PROJECT_COLORS } from '../parts/LayoutStyles';
import { getProjectDurationSeconds, formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';
import {
  ListTodo,
  BarChart3,
  Settings,
  Folder,
  Plus,
  ChevronDown,
  Check,
  PanelLeft,
  PanelRight,
  X,
  Clock
} from 'lucide-react';

type MediumLayoutBuilderProps = Omit<LayoutRouterProps, 'variant' | 'commonProps'> & {
  state: GuiState;
  dockPosition?: 'right' | 'left';
  onToggleDock?: () => void;
};

export default function MediumLayoutBuilder({
  state,
  dockPosition: externalDockPos,
  onToggleDock
}: MediumLayoutBuilderProps) {
  const {
    theme,
    projects = [],
    tasks = [],
    logs = [],
    nowIso = '',
    locale = 'en',
    customTranslations,
    selectedProjectId,
    setSelectedProjectId,
    onAddProject
  } = state;

  const [mediumTab, setMediumTab] = useState<'tasks' | 'reports' | 'settings'>('tasks');
  const [internalDockPos, setInternalDockPos] = useState<'right' | 'left'>(() => {
    try {
      return (localStorage.getItem('oxy_medium_dock_pos') as 'right' | 'left') || 'right';
    } catch {
      return 'right';
    }
  });

  const dockPosition = externalDockPos ?? internalDockPos;

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('violet');

  const toggleDock = () => {
    if (onToggleDock) {
      onToggleDock();
    } else {
      const next = dockPosition === 'right' ? 'left' : 'right';
      setInternalDockPos(next);
      try {
        localStorage.setItem('oxy_medium_dock_pos', next);
      } catch {
        // ignore storage error
      }
    }
  };

  const selectedProject =
    state.selectedProject ||
    projects.find((p: any) => p.id === selectedProjectId) ||
    projects[0];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onAddProject?.(newProjectName.trim(), newProjectColor, null, null, null);
    setNewProjectName('');
    setIsAddingProject(false);
    setIsProjectDropdownOpen(false);
  };

  return (
    <div
      data-testid="medium-layout"
      className="w-full flex-1 flex flex-col transition-all duration-300 min-h-0 overflow-hidden"
    >
      <div
        id="gui-container"
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        {/* Project Selector & Header Quick Actions */}
        <div className="relative mb-2.5 shrink-0">
          <div
            className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
              theme === 'light'
                ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421]'
                : theme === 'high-contrast'
                  ? 'bg-black border-2 border-white text-white'
                  : 'bg-white/5 border-white/10 text-white'
            }`}
          >
            {/* Project Quick Switcher Trigger */}
            <button
              type="button"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer hover:opacity-85 transition-opacity"
              title="Zmień projekt"
              aria-label="Wybierz projekt"
            >
              <div
                className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-1 ring-white/20"
                style={{
                  backgroundColor: selectedProject?.color
                    ? `var(--tw-color-${selectedProject.color}-500, #f97316)`
                    : '#f97316'
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm truncate block">
                    {selectedProject?.name ||
                      translate(locale, 'project', 'SelectProjectPlaceholder', customTranslations) ||
                      'Wybierz projekt'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isProjectDropdownOpen ? 'rotate-180 text-orange-400' : 'text-slate-400'
                    }`}
                  />
                </div>
                {selectedProject && (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-orange-500 font-semibold">
                      <Clock className="w-3 h-3" />
                      {formatSeconds(
                        getProjectDurationSeconds(selectedProject.id, tasks, logs, nowIso)
                      )}
                    </span>
                    <span>·</span>
                    <span>{tasks.filter((t: any) => t.projectId === selectedProject.id).length} zadań</span>
                  </div>
                )}
              </div>
            </button>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsProjectDropdownOpen(true);
                  setIsAddingProject(true);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white border-[#DFD7CB] text-orange-600 hover:bg-orange-50'
                    : 'bg-white/10 border-white/10 text-orange-400 hover:bg-white/20'
                }`}
                title="Nowy projekt"
                aria-label="Nowy projekt"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* PC Dock Position Switcher (visible on desktop) */}
              <button
                type="button"
                onClick={toggleDock}
                className={`hidden lg:flex p-2 rounded-xl border transition-all cursor-pointer items-center justify-center ${
                  theme === 'light'
                    ? 'bg-white border-[#DFD7CB] text-slate-700 hover:bg-slate-100'
                    : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20'
                }`}
                title={
                  dockPosition === 'right'
                    ? 'Przełącz pasek na lewą stronę PC'
                    : 'Przełącz pasek na prawą stronę PC'
                }
                aria-label="Przełącz stronę dokowania"
              >
                {dockPosition === 'right' ? (
                  <PanelLeft className="w-4 h-4" />
                ) : (
                  <PanelRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Project Dropdown / Modal Overlay */}
          {isProjectDropdownOpen && (
            <div
              className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
                theme === 'light'
                  ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]'
                  : theme === 'high-contrast'
                    ? 'bg-black border-2 border-white text-white'
                    : 'bg-slate-900 border-white/20 text-white backdrop-blur-2xl'
              }`}
            >
              <div className="p-3 border-b border-inherit flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    {translate(locale, 'project', 'ProjectsLabel', customTranslations) || 'Projekty'} (
                    {projects.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setIsAddingProject(false);
                  }}
                  className="p-1 rounded-lg hover:opacity-70 cursor-pointer"
                  aria-label="Zamknij"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {isAddingProject ? (
                <form onSubmit={handleCreateProject} className="p-3 border-b border-inherit bg-orange-500/5">
                  <p className="text-xs font-semibold mb-2 text-orange-500">Dodaj nowy projekt</p>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="Nazwa projektu..."
                    autoFocus
                    required
                    className={`w-full px-3 py-2 text-xs rounded-xl border mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                      theme === 'light'
                        ? 'bg-white border-[#DFD7CB] text-[#2C2421]'
                        : 'bg-black/50 border-white/20 text-white'
                    }`}
                  />
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setNewProjectColor(c.name)}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                          newProjectColor === c.name
                            ? 'scale-125 ring-2 ring-orange-400'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(false)}
                      className="px-3 py-1.5 text-xs rounded-lg hover:opacity-70 cursor-pointer"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={!newProjectName.trim()}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white cursor-pointer disabled:opacity-50"
                    >
                      Utwórz
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-2 border-b border-inherit">
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nowy projekt</span>
                  </button>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1">
                {projects.map((p: any) => {
                  const isSelected = p.id === selectedProject?.id;
                  const dur = getProjectDurationSeconds(p.id, tasks, logs, nowIso);
                  const pTasks = tasks.filter((t: any) => t.projectId === p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId?.(p.id);
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300 font-bold'
                          : 'hover:bg-slate-500/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: p.color
                              ? `var(--tw-color-${p.color}-500, #f97316)`
                              : '#f97316'
                          }}
                        />
                        <span className="text-xs truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-400">
                        <span>{formatSeconds(dur)}</span>
                        <span className="text-[10px]">({pTasks.length})</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 ml-1 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Viewport Content Area */}
        <div id="tasks-main" className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-0.5">
          {mediumTab === 'tasks' && (
            <>
              <ActiveTimerBanner state={state} isCondensed={true} />
              <TaskListView state={state} isCondensed={true} />
            </>
          )}

          {mediumTab === 'reports' && <ReportView state={state} />}

          {mediumTab === 'settings' && (
            <div className="flex flex-col gap-4">
              <SettingsTab />
              <DbInspector state={state} isCondensed={true} />
            </div>
          )}
        </div>

        {/* Bottom Navigation Thumb Bar */}
        <nav
          id="medium-bottom-nav"
          className={`shrink-0 mt-2 p-1.5 border-t rounded-2xl grid grid-cols-3 gap-2 z-30 transition-all ${
            theme === 'light'
              ? 'bg-[#FCFAF8]/95 border-[#DFD7CB] backdrop-blur-md text-[#2C2421]'
              : theme === 'high-contrast'
                ? 'bg-black border-2 border-white text-white'
                : 'bg-slate-900/95 border-white/10 backdrop-blur-md text-white'
          }`}
        >
          <button
            type="button"
            data-testid="medium-tab-tasks"
            onClick={() => setMediumTab('tasks')}
            className={`flex-1 min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
              mediumTab === 'tasks'
                ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[11px] tracking-tight">
              {translate(locale, 'app', 'TabMain', customTranslations) || 'Zadania'}
            </span>
          </button>

          <button
            type="button"
            data-testid="medium-tab-reports"
            onClick={() => setMediumTab('reports')}
            className={`flex-1 min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
              mediumTab === 'reports'
                ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[11px] tracking-tight">
              {translate(locale, 'report', 'TabReports', customTranslations) || 'Raporty'}
            </span>
          </button>

          <button
            type="button"
            data-testid="medium-tab-settings"
            onClick={() => setMediumTab('settings')}
            className={`flex-1 min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
              mediumTab === 'settings'
                ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[11px] tracking-tight">
              {translate(locale, 'settings', 'TabOptions', customTranslations) || 'Ustawienia'}
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
