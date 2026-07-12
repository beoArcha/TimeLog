import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { Folder, Plus, Sparkles, Clock, Pencil } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { getProjectDurationSeconds, formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { PROJECT_COLORS, getScaleStyles } from './GuiStyles';
import versionsData from '../../versions.json';

export default function Sidebar({ state }: { state: GuiState }) {
  const {
    projects, tasks, logs, nowIso, locale, customTranslations, theme,
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

  // Add Project Advanced fields
  const [showAddAdvanced, setShowAddAdvanced] = React.useState(false);
  const [newProjectDesc, setNewProjectDesc] = React.useState('');
  const [newProjectIcon, setNewProjectIcon] = React.useState('');
  const [newProjectTags, setNewProjectTags] = React.useState('');

  // Edit Project Modal fields
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editProjId, setEditProjId] = React.useState('');
  const [editProjName, setEditProjName] = React.useState('');
  const [editProjColor, setEditProjColor] = React.useState('');
  const [editProjDesc, setEditProjDesc] = React.useState('');
  const [editProjIcon, setEditProjIcon] = React.useState('');
  const [editProjTags, setEditProjTags] = React.useState('');

  const sc = getScaleStyles(state.textAndIconSize || 'medium');

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
    <div id="projects-sidebar" className={`lg:col-span-4 flex flex-col ${sc.gapMain}`}>
      <div className={`backdrop-blur-md ${sc.roundedMain} ${sc.paddingMain} border shadow-2xl transition-all duration-300 ${theme === 'light'
        ? 'bg-[#FCFAF8] border-[#DFD7CB] shadow-[#DFD7CB]'
        : theme === 'high-contrast'
          ? 'bg-black border-2 border-white text-white'
          : 'bg-[#FCFAF8]/5 border-white/10'
        }`}>
        <div className={`flex items-center justify-between mb-4 border-b pb-3 ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
          }`}>
          <h3 className={`font-sans font-semibold ${sc.textTitle} flex items-center gap-2 ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
            }`}>
            <Folder className={`${sc.iconMedium} text-orange-400`} />
            {translate(locale, 'project', 'ProjectsLabel', customTranslations)} ({projects.length})
          </h3>
          <span className={`${sc.textMain} bg-orange-500/20 border border-orange-500/30 text-orange-600 px-2 py-1 rounded-full font-mono font-bold uppercase tracking-wider`}>
            MicroORM Tables
          </span>
        </div>

        <form onSubmit={handleAddProjectSubmit} className={`mb-6 ${sc.paddingSection} ${sc.roundedSection} border transition-all ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
          <div className={`flex flex-col ${sc.gapSection}`}>
            <input
              id="new-project-input"
              type="text"
              placeholder={translate(locale, 'project', 'EnterProjectName', customTranslations)}
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              className={`w-full border px-3 ${sc.inputPy} ${sc.roundedSection} ${sc.textMain} focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all ${theme === 'light'
                ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
                : 'bg-[#FCFAF8]/5 border-white/10 text-white placeholder-[#9B8C83]'
                }`}
            />

            <div className="flex justify-between items-center mt-1">
              <button
                type="button"
                onClick={() => setShowAddAdvanced(!showAddAdvanced)}
                className="text-[10px] font-mono text-slate-400 hover:text-orange-450 transition-colors uppercase tracking-wider cursor-pointer"
              >
                {showAddAdvanced ? 'Hide Options' : 'More Options'}
              </button>
            </div>

            {showAddAdvanced && (
              <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-[#DFD7CB]/40 dark:border-white/5 animate-fade-in">
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <input
                      type="text"
                      placeholder="Icon (🚀)"
                      maxLength={2}
                      value={newProjectIcon}
                      onChange={e => setNewProjectIcon(e.target.value)}
                      className={`w-full px-2 py-1 border rounded-lg text-center outline-none text-xs ${
                        theme === 'light'
                          ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]'
                          : 'bg-black/20 border-white/10 text-white'
                      }`}
                    />
                  </div>
                  <div className="w-2/3">
                    <input
                      type="text"
                      placeholder="Tags (tag1, tag2)"
                      value={newProjectTags}
                      onChange={e => setNewProjectTags(e.target.value)}
                      className={`w-full px-2 py-1 border rounded-lg outline-none text-xs ${
                        theme === 'light'
                          ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]'
                          : 'bg-black/20 border-white/10 text-white'
                      }`}
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Project description..."
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className={`w-full px-2 py-1 border rounded-lg outline-none text-xs h-10 resize-none ${
                    theme === 'light'
                      ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]'
                      : 'bg-black/20 border-white/10 text-white'
                  }`}
                />
              </div>
            )}

            <div className={`flex items-center justify-between ${sc.gapSection} mt-1`}>
              <div className="flex gap-1.5">
                {PROJECT_COLORS.map(col => (
                  <button
                    id={`color-picker-${col.name}`}
                    key={col.name}
                    type="button"
                    onClick={() => setNewProjectColor(col.name)}
                    className={`${sc.iconLarge} rounded-full ${col.bg} transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${newProjectColor === col.name ? 'ring-2 ring-orange-500 ring-offset-2 scale-105' : 'opacity-80'
                      }`}
                  >
                    {newProjectColor === col.name && (
                      <span className="w-1.5 h-1.5 bg-[#FCFAF8] rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
              <button
                id="add-project-btn"
                type="submit"
                className={`bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white ${sc.roundedSection} px-3.5 py-1.5 ${sc.textMain} font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-md`}
              >
                <Plus className={sc.iconSmall} /> {translate(locale, 'common', 'Save', customTranslations)}
              </button>
            </div>
          </div>
        </form>

        {/* Project List */}
        <div id="projects-list-container" className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-[#9B8C83] text-xs font-sans">
              {translate(locale, 'project', 'NoProjectsYet', customTranslations)}
            </div>
          ) : (
            projects.map(p => {
              const projColor = PROJECT_COLORS.find(c => c.name === p.color) || PROJECT_COLORS[0];
              const totalSeconds = getProjectDurationSeconds(p.id, tasks, logs, nowIso);
              const isSelected = selectedProjectId === p.id;

              return (
                <div
                  id={`project-item-${p.id}`}
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`text-left w-full ${sc.paddingSection} ${sc.roundedSection} flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer group ${isSelected
                    ? theme === 'light'
                      ? 'bg-orange-50 border-l-4 border-l-orange-500 border border-[#DFD7CB]/80 shadow-sm'
                      : theme === 'high-contrast'
                        ? 'bg-black border-l-4 border-l-yellow-400 border-2 border-white'
                        : 'bg-[#FCFAF8]/10 border-l-4 border-l-orange-400 border border-white/15'
                    : theme === 'light'
                      ? 'bg-transparent border border-transparent hover:bg-[#EAE4DB] text-[#2C2421]'
                      : 'bg-transparent border border-transparent hover:bg-[#FCFAF8]/5'
                    } ${p.archived ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="flex items-center gap-2.5 z-10 animate-fade-in min-w-0 flex-1 mr-2">
                    {p.icon ? (
                      <span className={`${sc.iconMedium} flex items-center justify-center text-lg shrink-0`}>
                        {p.icon}
                      </span>
                    ) : (
                      <span className={`${sc.iconSmall} rounded-full ${projColor.bg} shadow-md shadow-black/20 shrink-0`} />
                    )}
                    <div className="min-w-0 flex-1">
                      {editingId === p.id ? (
                        <input
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
                          className={`font-semibold ${sc.textMain} rounded px-1 outline-none ${theme === 'light' ? 'bg-white text-[#2C2421] border-[#DFD7CB]' : 'bg-black text-white border-white/20'
                            } border`}
                        />
                      ) : (
                        <p className={`font-semibold ${sc.textMain} truncate ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
                          }`}>{p.archived && <span className={`${sc.textMain} bg-red-500 text-white px-1 py-0.5 rounded mr-1 leading-none uppercase`}>{translate(locale, 'common', 'ArchiveNoun', customTranslations)}</span>}{p.name}</p>
                      )}

                      {p.description && (
                        <p className={`text-[10px] leading-tight mt-0.5 truncate ${theme === 'light' ? 'text-[#7A6A61]' : 'text-slate-400'}`}>
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

                      <p className={`${sc.textMain} opacity-80 font-sans tracking-wide flex items-center gap-2 mt-0.5 ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'
                        }`}>
                        {translate(locale, 'common', 'CreatedAtLabel', customTranslations)} {new Date(p.createdAt).toLocaleDateString()}
 
                        {editingId !== p.id && (
                          <button
                            id={`edit-project-btn-${p.id}`}
                            type="button"
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
                            className={`opacity-0 group-hover:opacity-100 transition duration-200 p-1 rounded text-slate-500 hover:text-orange-500 hover:bg-orange-500/10 cursor-pointer`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
 
                        <button
                          id={`archive-project-btn-${p.id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleProjectArchive) onToggleProjectArchive(p.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition duration-200 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${theme === 'light' ? 'bg-[#DFD7CB] text-[#5A4A42] hover:bg-red-500 hover:text-white' : 'bg-[#FCFAF8]/10 text-slate-300 hover:bg-red-500 hover:text-white'
                            } cursor-pointer`}
                        >
                          {p.archived ? translate(locale, 'common', 'Unarchive', customTranslations) : translate(locale, 'common', 'Archive', customTranslations)}
                        </button>
                      </p>
                    </div>
                  </div>
 
                  <div className={`flex items-center gap-1.5 z-10 font-mono ${sc.textMain} font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 ${theme === 'light'
                    ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#5A4A42]'
                    : theme === 'high-contrast'
                      ? 'bg-black border-white text-white'
                      : 'bg-[#FCFAF8]/5 border-white/10 text-[#9B8C83]'
                    }`}>
                    <Clock className={`${sc.iconMedium} text-orange-450`} />
                    {formatSeconds(totalSeconds)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
 
      <div className={`border ${sc.roundedMain} ${sc.paddingMain} relative overflow-hidden shadow-2xl transition-all duration-300 ${theme === 'light'
        ? 'bg-gradient-to-tr from-orange-500/5 to-rose-500/5 border-[#DFD7CB]'
        : theme === 'high-contrast'
          ? 'bg-black border-2 border-white text-white'
          : 'bg-gradient-to-tr from-orange-500/10 to-rose-500/10 border-white/10 text-white'
        }`}>
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d">
            <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="white" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium tracking-wide border ${theme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#5A4A42]' : 'bg-[#FCFAF8]/10 border-white/10'
              }`}>{translate(locale, 'engine', 'CountingEngine', customTranslations)} v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.engine}</span>
          </div>
          <h4 className={`font-sans font-bold text-lg mt-1 ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-100'}`}>{translate(locale, 'engine', 'CreatedForRhythm', customTranslations)}</h4>
          <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-[#7A6A61]' : 'text-slate-300'}`}>
            {translate(locale, 'engine', 'HeroDescription', customTranslations)}
          </p>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl transition-all duration-300 ${
            theme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]' : 'bg-[#1b1c21] border-white/10 text-white'
          }`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-orange-450" />
              Edit Project Details
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  value={editProjName}
                  onChange={e => setEditProjName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-400 ${
                    theme === 'light' ? 'bg-white border-[#DFD7CB] text-[#2C2421]' : 'bg-black/20 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    placeholder="🚀"
                    maxLength={2}
                    value={editProjIcon}
                    onChange={e => setEditProjIcon(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl outline-none text-center text-xl focus:ring-2 focus:ring-orange-400 ${
                      theme === 'light' ? 'bg-white border-[#DFD7CB] text-[#2C2421]' : 'bg-black/20 border-white/10 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">Color Theme</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PROJECT_COLORS.map(col => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setEditProjColor(col.name)}
                        className={`w-5 h-5 rounded-full ${col.bg} transition-all duration-300 transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                          editProjColor === col.name ? 'ring-2 ring-orange-500 ring-offset-2 scale-105' : 'opacity-85'
                        }`}
                      >
                        {editProjColor === col.name && (
                          <span className="w-1 h-1 bg-[#FCFAF8] rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">Description</label>
                <textarea
                  placeholder="Optional project description..."
                  value={editProjDesc}
                  onChange={e => setEditProjDesc(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl outline-none h-16 resize-none focus:ring-2 focus:ring-orange-400 ${
                    theme === 'light' ? 'bg-white border-[#DFD7CB] text-[#2C2421]' : 'bg-black/20 border-white/10 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="work, personal, design"
                  value={editProjTags}
                  onChange={e => setEditProjTags(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-400 ${
                    theme === 'light' ? 'bg-white border-[#DFD7CB] text-[#2C2421]' : 'bg-black/20 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl border cursor-pointer ${
                    theme === 'light' ? 'bg-white border-[#DFD7CB] text-[#2C2421] hover:bg-slate-50' : 'bg-transparent border-white/10 hover:bg-white/5 text-white'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
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
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 rounded-xl shadow-md cursor-pointer border-0"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
