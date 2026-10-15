import React, { useState } from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { PROJECT_COLORS } from './LayoutStyles';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';
import { ProjectBadge } from '@/src/features/projects/components/ProjectBadge';
import { MediumHeaderActions } from './MediumHeaderActions';
import {
  Folder,
  Plus,
  ChevronDown,
  Check,
  X,
  Clock,
} from 'lucide-react';

export interface MediumProjectSelectorProps {
  state: GuiState;
  dockPosition: 'right' | 'left';
  onToggleDock: () => void;
}

export default function MediumProjectSelector({
  state,
  dockPosition,
  onToggleDock,
}: MediumProjectSelectorProps) {
  const {
    theme,
    projects = [],
    tasks = [],
    locale = 'en',
    customTranslations,
    selectedProjectId,
    setSelectedProjectId,
    onAddProject,
  } = state;

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('violet');

  const selectedProject =
    state.selectedProject ||
    projects.find(p => p.id === selectedProjectId) ||
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
        <button
          type="button"
          onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 rounded-xl p-1"
          title={
            translate(locale, 'project', 'ChangeProject', customTranslations) ||
            'Change project'
          }
          aria-label={
            translate(locale, 'project', 'SelectProject', customTranslations) ||
            'Select project'
          }
          aria-expanded={isProjectDropdownOpen}
          aria-haspopup="dialog"
        >
          <div
            className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-1 ring-white/20"
            style={{
              backgroundColor: selectedProject?.color
                ? `var(--tw-color-${selectedProject.color}-500, #f97316)`
                : '#f97316',
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm truncate block">
                {selectedProject?.name ||
                  translate(locale, 'project', 'SelectProjectPlaceholder', customTranslations) ||
                  'Select project'}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isProjectDropdownOpen ? 'rotate-180 text-orange-400' : 'text-slate-400'
                }`}
              />
            </div>
            {selectedProject && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-orange-500 font-semibold">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {formatSeconds(
                    state.metrics?.projects?.[selectedProject.id]?.totalElapsedSeconds ?? 0
                  )}
                </span>
                <span>·</span>
                <span>
                  {tasks.filter(t => t.projectId === selectedProject.id).length}{' '}
                  {translate(locale, 'project', 'TotalTasks', customTranslations) || 'tasks'}
                </span>
              </div>
            )}
          </div>
        </button>

        <MediumHeaderActions
          theme={theme}
          dockPosition={dockPosition}
          onToggleDock={onToggleDock}
          onOpenCreateProject={() => {
            setIsProjectDropdownOpen(true);
            setIsAddingProject(true);
          }}
          locale={locale}
          customTranslations={customTranslations}
        />
      </div>

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
            {projects.map(p => {
              const isSelected = p.id === selectedProject?.id;
              const dur = state.metrics?.projects?.[p.id]?.totalElapsedSeconds ?? 0;
              const pTasks = tasks.filter(t => t.projectId === p.id);
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
                  <ProjectBadge
                    name={p.name}
                    color={p.color}
                    icon={p.icon}
                    size="sm"
                    className="flex-1"
                  />
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
  );
}
