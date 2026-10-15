import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { Folder, Clock, Pencil, Plus } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { PROJECT_COLORS } from './LayoutStyles';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Label } from '@components/ui/label';

export default function Sidebar({ state }: { state: GuiState }) {
  const {
    projects, metrics, locale, customTranslations,
    onAddProject, onUpdateProject, selectedProjectId, setSelectedProjectId,
    onRenameProject, onToggleProjectArchive
  } = state;

  const [newProjectName, setNewProjectNameLocal] = React.useState(() => state.newProjectName ?? '');
  const [newProjectColor, setNewProjectColorLocal] = React.useState(() => state.newProjectColor ?? 'violet');
  const [editingId, setEditingIdLocal] = React.useState<string | null>(() => state.editingId ?? null);
  const [editName, setEditNameLocal] = React.useState(() => state.editName ?? '');

  const setNewProjectName = React.useCallback((val: string) => {
    setNewProjectNameLocal(val);
    state.setNewProjectName?.(val);
  }, [state]);

  const setNewProjectColor = React.useCallback((val: string) => {
    setNewProjectColorLocal(val);
    state.setNewProjectColor?.(val);
  }, [state]);

  const setEditingId = React.useCallback((val: string | null | ((prev: string | null) => string | null)) => {
    setEditingIdLocal(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      state.setEditingId?.(next);
      return next;
    });
  }, [state]);

  const setEditName = React.useCallback((val: string | ((prev: string) => string)) => {
    setEditNameLocal(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      state.setEditName?.(next);
      return next;
    });
  }, [state]);

  const [showAddAdvanced, setShowAddAdvanced] = React.useState(false);
  const [newProjectDesc, setNewProjectDesc] = React.useState('');
  const [newProjectIcon, setNewProjectIcon] = React.useState('');
  const [newProjectTags, setNewProjectTags] = React.useState('');

  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editProjId, setEditProjId] = React.useState('');
  const [editProjName, setEditProjName] = React.useState('');
  const [editProjColor, setEditProjColor] = React.useState('');
  const [editProjDesc, setEditProjDesc] = React.useState('');
  const [editProjIcon, setEditProjIcon] = React.useState('');
  const [editProjTags, setEditProjTags] = React.useState('');

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const tagsArr = newProjectTags.split(',').map(t => t.trim()).filter(Boolean);
    onAddProject(
      newProjectName.trim(),
      newProjectColor,
      newProjectDesc.trim() || null,
      newProjectIcon.trim() || null,
      tagsArr.length > 0 ? tagsArr : null
    );
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectIcon('');
    setNewProjectTags('');
    setShowAddAdvanced(false);
  };

  return (
    <div id="projects-sidebar" className="lg:col-span-4 flex flex-col gap-main">
      <div className="backdrop-blur-md rounded-main padding-main border border-border bg-card text-card-foreground shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <h3 className="font-sans font-semibold text-title flex items-center gap-2 text-foreground">
            <Folder className="icon-medium text-orange-400" />
            {translate(locale, 'project', 'ProjectsLabel', customTranslations)} ({projects.length})
          </h3>
          <span className="text-main bg-orange-500/20 border border-orange-500/30 text-orange-600 px-2 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
            MicroORM Tables
          </span>
        </div>

        <form onSubmit={handleAddProjectSubmit} className="mb-6 padding-section rounded-section border border-border bg-muted/40 transition-all">
          <div className="flex flex-col gap-section">
            <Input
              id="new-project-input"
              type="text"
              placeholder={translate(locale, 'project', 'EnterProjectName', customTranslations)}
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              className="w-full border border-input bg-card text-foreground placeholder:text-muted-foreground px-3 input-py rounded-section text-main focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all"
            />

            <div className="flex justify-between items-center mt-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setShowAddAdvanced(!showAddAdvanced)}
                className="text-[10px] font-mono text-muted-foreground hover:text-orange-500 transition-colors uppercase tracking-wider h-auto p-0"
              >
                {translate(locale, 'project', showAddAdvanced ? 'HideOptions' : 'MoreOptions', customTranslations)}
              </Button>
            </div>

            {showAddAdvanced && (
              <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-border/40 animate-fade-in">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <Input
                      type="text"
                      placeholder={translate(locale, 'project', 'IconPlaceholder', customTranslations)}
                      maxLength={2}
                      value={newProjectIcon}
                      onChange={e => setNewProjectIcon(e.target.value)}
                      className="w-full px-2 py-1 text-center text-xs"
                    />
                  </div>
                  <div className="w-2/3">
                    <Input
                      type="text"
                      placeholder={translate(locale, 'project', 'TagsPlaceholder', customTranslations)}
                      value={newProjectTags}
                      onChange={e => setNewProjectTags(e.target.value)}
                      className="w-full px-2 py-1 text-xs"
                    />
                  </div>
                </div>
                <Textarea
                  placeholder={translate(locale, 'project', 'DescriptionPlaceholder', customTranslations)}
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className="w-full px-2 py-1 text-xs min-h-[40px] h-10 resize-none"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-section mt-1.5">
              <div className="flex flex-wrap gap-1.5">
                {PROJECT_COLORS.map(col => (
                  <Button
                    id={`color-picker-${col.name}`}
                    key={col.name}
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setNewProjectColor(col.name)}
                    className={`w-6 h-6 rounded-full ${col.bg} transition-all duration-300 transform hover:scale-110 flex items-center justify-center p-0 ${newProjectColor === col.name ? 'ring-2 ring-orange-500 ring-offset-2 scale-105' : 'opacity-85'
                      }`}
                  >
                    {newProjectColor === col.name && (
                      <span className="w-1.5 h-1.5 bg-card rounded-full"></span>
                    )}
                  </Button>
                ))}
              </div>

              <Button
                id="add-project-btn"
                type="submit"
                variant="accent"
                className="rounded-xl px-4 py-1 text-main font-bold shadow-md cursor-pointer flex items-center gap-1.5 h-auto"
              >
                <Plus className="icon-small" /> {translate(locale, 'common', 'Save', customTranslations)}
              </Button>
            </div>
          </div>
        </form>

        <div id="projects-list-container" className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs font-sans">
              {translate(locale, 'project', 'NoProjectsYet', customTranslations)}
            </div>
          ) : (
            projects.map(p => {
              const projColor = PROJECT_COLORS.find(c => c.name === p.color) || PROJECT_COLORS[0];
              const totalSeconds = metrics?.projects?.[p.id]?.totalElapsedSeconds ?? 0;
              const isSelected = selectedProjectId === p.id;

              return (
                <div
                  id={`project-item-${p.id}`}
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`text-left w-full padding-section rounded-section flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer group ${isSelected
                    ? 'bg-primary/10 border-l-4 border-l-primary border border-border shadow-xs'
                    : 'bg-transparent border border-transparent hover:bg-muted text-foreground'
                    } ${p.archived ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="flex items-center gap-2.5 z-10 animate-fade-in min-w-0 flex-1 mr-2">
                    {p.icon ? (
                      <span className="icon-medium flex items-center justify-center text-lg shrink-0">
                        {p.icon}
                      </span>
                    ) : (
                      <span className={`icon-small rounded-full ${projColor.bg} shadow-md shadow-black/20 shrink-0`} />
                    )}
                    <div className="min-w-0 flex-1">
                      {editingId === p.id ? (
                        <Input
                          type="text"
                          value={editName}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => {
                            if (onRenameProject && editName.trim() && editName.trim() !== p.name) {
                              onRenameProject(p.id, editName.trim());
                            }
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (onRenameProject && editName.trim() && editName.trim() !== p.name) {
                                onRenameProject(p.id, editName.trim());
                              }
                              setEditingId(null);
                            } else if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          className="font-semibold text-main rounded px-1 outline-none h-7 bg-background text-foreground border border-input"
                        />
                      ) : (
                        <p className="font-semibold text-main truncate text-foreground">{p.archived && <span className="text-main bg-destructive text-destructive-foreground px-1 py-0.5 rounded mr-1 leading-none uppercase">{translate(locale, 'common', 'ArchiveNoun', customTranslations)}</span>}{p.name}</p>
                      )}

                      {p.description && (
                        <p className="text-[10px] leading-tight mt-0.5 truncate text-muted-foreground">
                          {p.description}
                        </p>
                      )}

                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.tags.map(t => (
                            <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/15 font-sans leading-none">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-main opacity-80 font-sans tracking-wide flex items-center gap-2 mt-0.5 text-muted-foreground">
                        {translate(locale, 'common', 'CreatedAtLabel', customTranslations)} {new Date(p.createdAt).toLocaleDateString()}

                        {editingId !== p.id && (
                          <Button
                            id={`edit-project-btn-${p.id}`}
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            title={translate(locale, 'common', 'EditName', customTranslations)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditProjId(p.id);
                              setEditProjName(p.name);
                              setEditProjColor(p.color);
                              setEditProjDesc(p.description || '');
                              setEditProjIcon(p.icon || '');
                              setEditProjTags(p.tags ? p.tags.join(', ') : '');
                              setShowEditModal(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition duration-200 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          id={`archive-project-btn-${p.id}`}
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleProjectArchive) onToggleProjectArchive(p.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition duration-200 px-1.5 py-0.5 h-auto rounded text-[9px] uppercase font-bold tracking-wider hover:bg-destructive hover:text-destructive-foreground"
                        >
                          {p.archived ? translate(locale, 'common', 'Unarchive', customTranslations) : translate(locale, 'common', 'Archive', customTranslations)}
                        </Button>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 z-10 font-mono text-main font-bold px-2.5 py-1 rounded-full border border-border bg-card text-foreground transition-all shrink-0">
                    <Clock className="icon-medium text-orange-500" />
                    {formatSeconds(totalSeconds)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl border border-border bg-card text-card-foreground shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-orange-500" />
              {translate(locale, 'project', 'EditProjectTitle', customTranslations)}
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                  {translate(locale, 'project', 'ProjectName', customTranslations)}
                </Label>
                <Input
                  type="text"
                  value={editProjName}
                  onChange={e => setEditProjName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                    {translate(locale, 'project', 'EmojiIcon', customTranslations)}
                  </Label>
                  <Input
                    type="text"
                    placeholder="🚀"
                    maxLength={2}
                    value={editProjIcon}
                    onChange={e => setEditProjIcon(e.target.value)}
                    className="w-full text-center text-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                    {translate(locale, 'project', 'ColorTheme', customTranslations)}
                  </Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PROJECT_COLORS.map(col => (
                      <Button
                        key={col.name}
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setEditProjColor(col.name)}
                        className={`w-5 h-5 rounded-full ${col.bg} transition-all duration-300 transform hover:scale-110 flex items-center justify-center p-0 ${editProjColor === col.name ? 'ring-2 ring-orange-500 ring-offset-2 scale-105' : 'opacity-85'
                          }`}
                      >
                        {editProjColor === col.name && (
                          <span className="w-1 h-1 bg-card rounded-full"></span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                  {translate(locale, 'project', 'Description', customTranslations)}
                </Label>
                <Textarea
                  placeholder={translate(locale, 'project', 'DescriptionPlaceholder', customTranslations)}
                  value={editProjDesc}
                  onChange={e => setEditProjDesc(e.target.value)}
                  className="w-full h-16 resize-none"
                />
              </div>

              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                  {translate(locale, 'project', 'Tags', customTranslations)}
                </Label>
                <Input
                  type="text"
                  placeholder={translate(locale, 'project', 'TagsPlaceholder', customTranslations)}
                  value={editProjTags}
                  onChange={e => setEditProjTags(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  {translate(locale, 'common', 'Cancel', customTranslations)}
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  onClick={() => {
                    if (onUpdateProject && editProjName.trim()) {
                      const tagsArr = editProjTags.split(',').map(t => t.trim()).filter(Boolean);
                      onUpdateProject(
                        editProjId,
                        editProjName.trim(),
                        editProjColor,
                        editProjDesc.trim() || null,
                        editProjIcon.trim() || null,
                        tagsArr.length > 0 ? tagsArr : null
                      );
                    }
                    setShowEditModal(false);
                  }}
                >
                  {translate(locale, 'common', 'Save', customTranslations)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
