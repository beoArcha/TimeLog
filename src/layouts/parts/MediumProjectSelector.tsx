import React, { useState } from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { PROJECT_COLORS } from './LayoutStyles';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';
import { ProjectBadge } from '@features/projects/components/ProjectBadge';
import { MediumHeaderActions } from './MediumHeaderActions';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { MonoText, Caption } from '@components/ui/typography';
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
    projects = [],
    tasks = [],
    locale = 'en',
    customTranslations,
    selectedProjectId,
    setSelectedProjectId,
    onAddProject,
    isLoading,
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
      <div className="p-2.5 sm:p-3 rounded-2xl border border-border bg-muted/40 text-foreground flex items-center justify-between gap-2 transition-all">
        <Button
          type="button"
          variant="ghost"
          data-testid="medium-project-dropdown-btn"
          onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer hover:opacity-85 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 rounded-xl p-1 h-auto justify-start"
          title={translate(locale, 'project', 'ChangeProject', customTranslations)}
          aria-label={translate(locale, 'project', 'SelectProject', customTranslations)}
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
                  translate(locale, 'project', 'SelectProjectPlaceholder', customTranslations)}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isProjectDropdownOpen ? 'rotate-180 text-orange-400' : 'text-muted-foreground'
                }`}
              />
            </div>
            {selectedProject && (
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1 text-orange-500 font-semibold">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {formatSeconds(
                    state.metrics?.projects?.[selectedProject.id]?.totalElapsedSeconds ?? 0
                  )}
                </span>
                <span>·</span>
                <span>
                  {tasks.filter(t => t.projectId === selectedProject.id).length}{' '}
                  {translate(locale, 'project', 'TotalTasks', customTranslations)}
                </span>
              </div>
            )}
          </div>
        </Button>

        <MediumHeaderActions
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
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-2xl">
          <div className="p-3 border-b border-inherit flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-xs uppercase tracking-wider">
                {translate(locale, 'project', 'ProjectsLabel', customTranslations)} (
                {projects.length})
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setIsProjectDropdownOpen(false);
                setIsAddingProject(false);
              }}
              className="p-1 rounded-lg hover:opacity-70 cursor-pointer text-muted-foreground"
              aria-label={translate(locale, 'common', 'Close', customTranslations)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {isAddingProject ? (
            <form onSubmit={handleCreateProject} className="p-3 border-b border-inherit bg-orange-500/5">
              <Caption weight="semibold" className="mb-2 text-orange-500 block">
                {translate(locale, 'project', 'NewProject', customTranslations)}
              </Caption>
              <Input
                type="text"
                data-testid="medium-new-project-input"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder={translate(locale, 'project', 'EnterProjectName', customTranslations)}
                autoFocus
                required
                className="w-full mb-2"
              />
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                {PROJECT_COLORS.map(c => (
                  <Button
                    key={c.name}
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setNewProjectColor(c.name)}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer p-0 ${
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingProject(false)}
                >
                  {translate(locale, 'common', 'Cancel', customTranslations)}
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  data-testid="medium-save-new-project-btn"
                  disabled={!newProjectName.trim() || isLoading}
                >
                  {translate(locale, 'common', 'Save', customTranslations)}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-2 border-b border-inherit">
              <Button
                type="button"
                variant="ghost"
                data-testid="medium-open-add-project-btn"
                onClick={() => setIsAddingProject(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-colors cursor-pointer h-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{translate(locale, 'project', 'NewProject', customTranslations)}</span>
              </Button>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1">
            {projects.map(p => {
              const isSelected = p.id === selectedProject?.id;
              const dur = state.metrics?.projects?.[p.id]?.totalElapsedSeconds ?? 0;
              const pTasks = tasks.filter(t => t.projectId === p.id);
              return (
                <Button
                  key={p.id}
                  type="button"
                  variant="ghost"
                  data-testid={`medium-project-item-${p.id}`}
                  onClick={() => {
                    setSelectedProjectId?.(p.id);
                    setIsProjectDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-2 text-left cursor-pointer transition-colors h-auto ${
                    isSelected
                      ? 'bg-orange-500/15 text-orange-500 font-bold'
                      : 'hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <ProjectBadge
                    name={p.name}
                    color={p.color}
                    icon={p.icon}
                    size="sm"
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs text-muted-foreground">
                    <span>{formatSeconds(dur)}</span>
                    <MonoText as="span">({pTasks.length})</MonoText>
                    {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 ml-1 shrink-0" />}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
