import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { translate } from '@common/i18n/translator';
import { EditProjectDialog } from './EditProjectDialog';
import { ProjectEmptyState } from './ProjectEmptyState';
import { StarterTemplate, resolveStarterTemplate } from '@common/templates/starterTemplates';
import { Project } from '@bindings/Project';
import { useProjectReorder } from '@common/hooks/useProjectReorder';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarProjectForm } from './sidebar/SidebarProjectForm';
import { SidebarProjectItem } from './sidebar/SidebarProjectItem';

export default function Sidebar({ state }: { state: GuiState }) {
  const {
    projects, metrics, locale, customTranslations,
    onAddProject, onUpdateProject, selectedProjectId, setSelectedProjectId,
    onRenameProject, onToggleProjectArchive, isLoading, activeLog
  } = state;

  const { orderedProjects, moveProject, isFirst, isLast } = useProjectReorder({ projects });
  const [editingId, setEditingIdLocal] = React.useState<string | null>(() => state.editingId ?? null);
  const [editName, setEditNameLocal] = React.useState(() => state.editName ?? '');
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);

  const setEditingId = React.useCallback((val: string | null) => {
    setEditingIdLocal(val);
    state.setEditingId?.(val);
  }, [state]);

  const setEditName = React.useCallback((val: string) => {
    setEditNameLocal(val);
    state.setEditName?.(val);
  }, [state]);

  const handleApplyTemplate = (template: StarterTemplate) => {
    const resolved = resolveStarterTemplate(template, locale, customTranslations);
    onAddProject(resolved.name, resolved.color, resolved.description, resolved.icon, resolved.tags);
  };

  const handleCommitInlineRename = (id: string, newName: string) => {
    const trimmed = newName.trim();
    const current = projects.find(p => p.id === id);
    if (onRenameProject && trimmed && trimmed !== current?.name) {
      onRenameProject(id, trimmed);
    }
    setEditingId(null);
  };

  return (
    <aside id="projects-sidebar" aria-label={translate(locale, 'project', 'ProjectsLabel', customTranslations)} className="lg:col-span-4 flex flex-col gap-main min-w-0 w-full">
      <div className="backdrop-blur-md rounded-main padding-main border border-border bg-card text-card-foreground shadow-2xl transition-all duration-300">
        <SidebarHeader count={projects.length} locale={locale} customTranslations={customTranslations} />

        <SidebarProjectForm
          onAddProject={onAddProject}
          isLoading={isLoading}
          locale={locale}
          customTranslations={customTranslations}
          initialName={state.newProjectName}
          initialColor={state.newProjectColor}
          onNameChange={state.setNewProjectName}
          onColorChange={state.setNewProjectColor}
        />

        <div id="projects-list-container" className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {orderedProjects.length === 0 ? (
            <ProjectEmptyState onApplyTemplate={handleApplyTemplate} locale={locale} customTranslations={customTranslations} />
          ) : (
            orderedProjects.map(p => (
              <SidebarProjectItem
                key={p.id}
                project={p}
                isSelected={selectedProjectId === p.id}
                metrics={metrics}
                activeLog={activeLog}
                totalSeconds={metrics?.projects?.[p.id]?.totalElapsedSeconds ?? 0}
                locale={locale}
                customTranslations={customTranslations}
                isFirst={isFirst(p.id)}
                isLast={isLast(p.id)}
                isEditingInline={editingId === p.id}
                inlineEditName={editName}
                onSelect={setSelectedProjectId}
                onEditDialog={setEditingProject}
                onToggleArchive={onToggleProjectArchive}
                onMoveUp={id => moveProject(id, 'up')}
                onMoveDown={id => moveProject(id, 'down')}
                onInlineNameChange={setEditName}
                onCommitInlineRename={handleCommitInlineRename}
                onCancelInlineRename={() => setEditingId(null)}
              />
            ))
          )}
        </div>
      </div>

      <EditProjectDialog
        open={editingProject !== null}
        onOpenChange={open => !open && setEditingProject(null)}
        project={editingProject}
        onSave={payload => {
          onUpdateProject?.(
            payload.id,
            payload.name,
            payload.color,
            payload.description,
            payload.icon,
            payload.tags,
            payload.allowConcurrency
          );
        }}
        locale={locale}
        customTranslations={customTranslations}
      />
    </aside>
  );
}
