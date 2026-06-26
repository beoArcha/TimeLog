import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { Project } from '@bindings/Project';
import CollapsibleCard from '@components/common/CollapsibleCard';
import { useOxyFlow } from '@common/providers/OxyContext';
import { translate } from '@common/i18n/i18n';

export default function ProjectsTable() {
  const { 
    projects, setProjects, 
    setTasks, setLogs, 
    locale, customTranslations, resolvedTheme 
  } = useOxyFlow();

  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [projForm, setProjForm] = useState<{ name: string; color: string; reason: string }>({ name: '', color: 'violet', reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);

  const colors = ['rose', 'teal', 'amber', 'violet', 'indigo', 'emerald'];

  const themeClasses = resolvedTheme === 'light' 
    ? { wrapper: 'bg-white border-slate-200 shadow-slate-100', tableHeader: 'border-slate-200 text-slate-500 bg-slate-100/50' }
    : resolvedTheme === 'high-contrast'
    ? { wrapper: 'bg-black border-white border-2', tableHeader: 'border-white text-white' }
    : { wrapper: 'bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', tableHeader: 'border-white/10 text-slate-400 bg-black/30' };

  const startEditProj = (p: Project) => {
    setEditingProjId(p.id);
    setProjForm({ name: p.name, color: p.color, reason: 'Korekta nazwy projektu' });
  };

  const saveEditProj = (id: string) => {
    setProjects(curr => curr.map(p => {
      if (p.id === id) {
        const hasChanged = p.name !== projForm.name || p.color !== projForm.color;
        if (!hasChanged) {
          setEditingProjId(null);
          return p;
        }
        const originalName = p.originalName || p.name;
        const originalColor = p.originalColor || p.color;

        const newHistoryItem = {
          editedAt: new Date().toISOString(),
          prevName: p.name,
          prevColor: p.color,
          reason: projForm.reason || 'Szybka edycja'
        };

        const updatedHistory = p.editHistory ? [...p.editHistory, newHistoryItem] : [newHistoryItem];

        return {
          ...p,
          name: projForm.name,
          color: projForm.color,
          originalName,
          originalColor,
          editHistory: updatedHistory
        };
      }
      return p;
    }));
    setEditingProjId(null);
  };

  const deleteProj = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten projekt oraz wszystkie jego zadania i logi?')) {
      setProjects(curr => curr.filter(p => p.id !== id));
      setTasks(curr => curr.filter(t => t.projectId !== id));
      setLogs(curr => curr.filter(l => l.projectId !== id));
    }
  };

  return (
    <CollapsibleCard
      title={`projects table (${projects.length} ${translate(locale, 'dynamic.records', customTranslations)})`}
      icon={Database}
      iconColor="text-orange-400"
      titleColor="text-orange-400"
      defaultExpanded={true}
      wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-orange-400"
    >
      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs font-mono text-left whitespace-nowrap">
          <thead>
            <tr className={`border-b ${themeClasses.tableHeader} uppercase text-[10px] tracking-wide`}>
              <th className="py-3 px-4 rounded-l-xl">id</th>
              <th className="py-3 px-4">name</th>
              <th className="py-3 px-4">color</th>
              <th className="py-3 px-4">{translate(locale, 'dynamic.originalValue', customTranslations)}</th>
              <th className="py-3 px-4 rounded-r-xl text-right">{translate(locale, 'dynamic.actionsCrud', customTranslations)}</th>
            </tr>
          </thead>
          <tbody className="dark:text-white">
            {projects.map(p => {
              const isEditing = editingProjId === p.id;
              const hasHistory = !!(p.originalName || p.originalColor || p.editHistory);

              return (
                <React.Fragment key={p.id}>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3.5 px-4 font-bold text-orange-500">{p.id}</td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={projForm.name} 
                          onChange={e => setProjForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded max-w-xs text-white placeholder-slate-500"
                        />
                      ) : (
                        <span className="font-semibold">{p.name}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <select 
                          value={projForm.color} 
                          onChange={e => setProjForm(prev => ({ ...prev, color: e.target.value }))}
                          className="bg-black border border-white/20 px-2 py-1 rounded"
                        >
                          {colors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <span className="flex items-center gap-1.5 capitalize">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full bg-${p.color}-500 shadow-md`} />
                          {p.color}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {hasHistory ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-md font-bold flex items-center gap-1.5 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          Oryginał: {p.originalName || p.name}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">{translate(locale, 'dynamic.noPatches', customTranslations)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasHistory && (
                          <button 
                            onClick={() => setShowHistoryRecordId(showHistoryRecordId === p.id ? null : p.id)}
                            className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
                            title="Zobacz historię rewizji"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isEditing ? (
                          <>
                            <div className="flex flex-col gap-1 inline-block mr-2 text-left">
                              <input 
                                type="text" 
                                placeholder="Powód zmiany (reason)" 
                                value={projForm.reason} 
                                onChange={e => setProjForm(prev => ({ ...prev, reason: e.target.value }))}
                                className="text-[9px] bg-black/45 border border-white/10 px-1 py-0.5 rounded w-28 text-white"
                              />
                            </div>
                            <button onClick={() => saveEditProj(p.id)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer" title="Zapisz">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingProjId(null)} className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer" title="Anuluj">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditProj(p)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer" title="Modyfikuj">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteProj(p.id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer" title="Wycofaj">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {showHistoryRecordId === p.id && p.editHistory && (
                    <tr>
                      <td colSpan={5} className="py-3 px-5 bg-black/20 border-b border-white/5 rounded-b-2xl">
                        <div className="flex flex-col gap-1.5 border-l-2 border-teal-500 pl-4 py-1">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
                            <History className="w-3" /> Historia poprawek obiektu (Database Log Audit Trail)
                          </p>
                          {p.editHistory.map((h, hIdx) => (
                            <div key={hIdx} className="text-[11px] text-slate-400 mt-1">
                              <span className="text-slate-500">[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                              {translate(locale, 'dbExplorer.changeFromName', customTranslations)} <strong className="text-white">"{h.prevName}"</strong> ({translate(locale, 'dbExplorer.color', customTranslations)} {h.prevColor}) &rarr;{' '}
                              {translate(locale, 'dbExplorer.reason', customTranslations)} <em className="text-teal-350">"{h.reason}"</em>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  );
}
