import React, { useState } from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { PROJECT_COLORS } from '@common/constants/projectColors';
import { translate } from '@common/i18n/translator';
import { ProjectBadge } from '@features/projects/components/ProjectBadge';
import { MediumHeaderActions } from './MediumHeaderActions';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Form } from '@components/ui/form';
import { Text, MonoText, Caption, Overline } from '@components/ui/typography';
import { HStack, VStack, InlineCluster } from '@components/ui/stack';
import { TimerDisplay } from '@features/timelogs/components/TimerDisplay';
import {
  Folder,
  Plus,
  ChevronDown,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { useLiveProjectElapsed } from '@common/hooks/useLiveTaskElapsed';
import { Project } from '@bindings/Project';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { TimeLog } from '@bindings/TimeLog';

export interface MediumProjectSelectorProps {
  state: GuiState;
  dockPosition: 'right' | 'left';
  onToggleDock: () => void;
}

interface MediumDropdownProjectItemProps {
  key?: React.Key;
  project: Project;
  isSelected: boolean;
  tasksCount: number;
  metrics?: EngineComputedMetrics | null;
  activeLog?: TimeLog | null;
  onSelect: (id: string) => void;
}

function MediumDropdownProjectItem({
  project,
  isSelected,
  tasksCount,
  metrics,
  activeLog,
  onSelect,
}: MediumDropdownProjectItemProps) {
  const { elapsedSeconds, isRunning } = useLiveProjectElapsed(project.id, {
    metrics,
    activeLog,
  });

  return (
    <Button
      type="button"
      variant="ghost"
      data-testid={`medium-project-item-${project.id}`}
      onClick={() => onSelect(project.id)}
      className={`w-full p-2.5 rounded-xl flex items-center justify-between gap-2 text-left cursor-pointer transition-colors h-auto ${
        isSelected
          ? 'bg-orange-500/15 text-orange-500 font-bold'
          : 'hover:bg-muted/50 text-foreground'
      }`}
    >
      <ProjectBadge
        name={project.name}
        color={project.color}
        icon={project.icon}
        size="sm"
        className="flex-1"
      />
      <HStack gap="xs" align="center" className="shrink-0 font-mono text-xs text-muted-foreground">
        <TimerDisplay
          value={elapsedSeconds}
          isRunning={isRunning}
          size="xs"
          className={isRunning ? 'text-orange-500 font-semibold' : ''}
        />
        <MonoText as="span">({tasksCount})</MonoText>
        {isSelected && <Check className="w-3.5 h-3.5 text-orange-500 ml-1 shrink-0" />}
      </HStack>
    </Button>
  );
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

  const { elapsedSeconds: selectedProjectSeconds, isRunning: isSelectedProjectRunning } =
    useLiveProjectElapsed(selectedProject?.id ?? '', {
      metrics: state.metrics,
      activeLog: state.activeLog,
    });

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
      <HStack
        justify="between"
        align="center"
        gap="sm"
        className="p-2.5 sm:p-3 rounded-2xl border border-border bg-muted/40 text-foreground transition-all"
      >
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
          <ProjectBadge
            name={selectedProject?.name || ''}
            color={selectedProject?.color}
            icon={selectedProject?.icon}
            size="md"
            showName={false}
          />
          <div className="min-w-0 flex-1">
            <HStack gap="xs" align="center">
              <Text weight="bold" size="sm" as="span" className="truncate block">
                {selectedProject?.name ||
                  translate(locale, 'project', 'SelectProjectPlaceholder', customTranslations)}
              </Text>
              <ChevronDown
                aria-hidden="true"
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isProjectDropdownOpen ? 'rotate-180 text-orange-400' : 'text-muted-foreground'
                }`}
              />
            </HStack>
            {selectedProject && (
              <HStack gap="xs" align="center" className="text-xs font-mono text-muted-foreground">
                <TimerDisplay
                  value={selectedProjectSeconds}
                  isRunning={isSelectedProjectRunning}
                  variant="plain"
                  size="xs"
                  className="text-orange-500 font-semibold"
                  icon={<Clock className={`w-3 h-3 ${isSelectedProjectRunning ? 'animate-spin-slow' : ''}`} aria-hidden="true" />}
                />
                <Text as="span" variant="muted" size="2xs">·</Text>
                <Caption as="span">
                  {tasks.filter(t => t.projectId === selectedProject.id).length}{' '}
                  {translate(locale, 'project', 'TotalTasks', customTranslations)}
                </Caption>
              </HStack>
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
      </HStack>

      {isProjectDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-2xl">
          <HStack justify="between" align="center" className="p-3 border-b border-inherit">
            <HStack gap="xs" align="center">
              <Folder className="w-4 h-4 text-orange-400" />
              <Overline weight="bold">
                {translate(locale, 'project', 'ProjectsLabel', customTranslations)} (
                {projects.length})
              </Overline>
            </HStack>
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
          </HStack>

          {isAddingProject ? (
            <Form onSubmit={handleCreateProject} layout="none" className="p-3 border-b border-inherit bg-orange-500/5">
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
              <InlineCluster gap="xs" className="mb-3">
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
              </InlineCluster>
              <HStack justify="end" gap="xs">
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
              </HStack>
            </Form>
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

          <VStack gap="xs" className="max-h-60 overflow-y-auto p-1.5">
            {projects.map(p => (
              <MediumDropdownProjectItem
                key={p.id}
                project={p}
                isSelected={p.id === selectedProject?.id}
                tasksCount={tasks.filter(t => t.projectId === p.id).length}
                metrics={state.metrics}
                activeLog={state.activeLog}
                onSelect={(id) => {
                  setSelectedProjectId?.(id);
                  setIsProjectDropdownOpen(false);
                }}
              />
            ))}
          </VStack>
        </div>
      )}
    </div>
  );
}
