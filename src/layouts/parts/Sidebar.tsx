import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { Folder, Plus, Sparkles, Clock, Pencil } from 'lucide-react';
import { translate } from '@common/i18n/i18n';
import { GuiKey } from '@common/i18n/keys/GuiKey';
import { CommonKey } from '@common/i18n/keys/CommonKey';
import { getProjectDurationSeconds, formatSeconds } from '@features/timelogs/utils/timelogUtils';
import { PROJECT_COLORS, getScaleStyles } from './guiStyles';
import versionsData from '../../versions.json';

export default function Sidebar({ state }: { state: GuiState }) {
  const {
    projects, tasks, logs, nowIso, locale, customTranslations, theme,
    newProjectName, setNewProjectName, newProjectColor, setNewProjectColor,
    onAddProject, selectedProjectId, setSelectedProjectId,
    editingId, setEditingId, editName, setEditName,
    onRenameProject, onToggleProjectArchive
  } = state;

  const sc = getScaleStyles(state.textAndIconSize || 'medium');

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onAddProject(newProjectName.trim(), newProjectColor);
    setNewProjectName('');
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
            {translate(locale, 'dynamic.projects', customTranslations)} ({projects.length})
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
              placeholder={translate(locale, GuiKey.EnterProjectName, customTranslations)}
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              className={`w-full border px-3 ${sc.inputPy} ${sc.roundedSection} ${sc.textMain} focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all ${theme === 'light'
                ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
                : 'bg-[#FCFAF8]/5 border-white/10 text-white placeholder-[#9B8C83]'
                }`}
            />
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
                <Plus className={sc.iconSmall} /> {translate(locale, CommonKey.Save, customTranslations)}
              </button>
            </div>
          </div>
        </form>

        {/* Project List */}
        <div id="projects-list-container" className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-[#9B8C83] text-xs font-sans">
              {translate(locale, 'dynamic.nenhumProjetoAindaAdicioneUmAc', customTranslations)}
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
                  <div className="flex items-center gap-2.5 z-10 animate-fade-in">
                    <span className={`${sc.iconSmall} rounded-full ${projColor.bg} shadow-md shadow-black/20`} />
                    <div>
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
                        <p className={`font-semibold ${sc.textMain} ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
                          }`}>{p.archived && <span className={`${sc.textMain} bg-red-500 text-white px-1 py-0.5 rounded mr-1 leading-none uppercase`}>{translate(locale, 'dynamic.archiveNoun', customTranslations)}</span>}{p.name}</p>
                      )}
                      <p className={`${sc.textMain} opacity-80 font-sans tracking-wide flex items-center gap-2 ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'
                        }`}>
                        {translate(locale, 'dynamic.createdAtLabel', customTranslations)} {new Date(p.createdAt).toLocaleDateString()}

                        {editingId !== p.id && (
                          <button
                            type="button"
                            title={translate(locale, 'common.editName', customTranslations)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(p.id);
                              setEditName(p.name);
                            }}
                            className={`opacity-0 group-hover:opacity-100 transition duration-200 p-1 rounded text-slate-500 hover:text-orange-500 hover:bg-orange-500/10`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleProjectArchive) onToggleProjectArchive(p.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition duration-200 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${theme === 'light' ? 'bg-[#DFD7CB] text-[#5A4A42] hover:bg-red-500 hover:text-white' : 'bg-[#FCFAF8]/10 text-slate-300 hover:bg-red-500 hover:text-white'
                            }`}
                        >
                          {p.archived ? translate(locale, 'dynamic.unarchive', customTranslations) : translate(locale, 'dynamic.archive', customTranslations)}
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 z-10 font-mono ${sc.textMain} font-bold px-2.5 py-1 rounded-full border transition-all ${theme === 'light'
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
              }`}>{translate(locale, 'dynamic.countingEngine', customTranslations)} v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.engine}</span>
          </div>
          <h4 className={`font-sans font-bold text-lg mt-1 ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-100'}`}>{translate(locale, 'dynamic.createdForRhythm', customTranslations)}</h4>
          <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-[#7A6A61]' : 'text-slate-300'}`}>
            {translate(locale, 'dynamic.heroDescription', customTranslations)}
          </p>
        </div>
      </div>
    </div>
  );
}
