import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { Task } from '@bindings/Task';
import CollapsibleCard from '@components/common/CollapsibleCard';
import { useOxyFlow } from '@common/providers/OxyContext';
import { translate } from '@common/i18n/i18n';

export default function TasksTable() {
  const { 
    tasks, setTasks, 
    setLogs, 
    locale, customTranslations, resolvedTheme 
  } = useOxyFlow();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<{ name: string; completed: boolean; reason: string }>({ name: '', completed: false, reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);

  const themeClasses = resolvedTheme === 'light' 
    ? { wrapper: 'bg-white border-slate-200 shadow-slate-100', tableHeader: 'border-slate-200 text-slate-500 bg-slate-100/50' }
    : resolvedTheme === 'high-contrast'
    ? { wrapper: 'bg-black border-white border-2', tableHeader: 'border-white text-white' }
    : { wrapper: 'bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', tableHeader: 'border-white/10 text-slate-400 bg-black/30' };

  const startEditTask = (t: Task) => {
    setEditingTaskId(t.id);
    setTaskForm({ name: t.name, completed: t.completed, reason: 'Korekta statusu/nazwy zadania' });
  };

  const saveEditTask = (id: string) => {
    setTasks(curr => curr.map(t => {
      if (t.id === id) {
        const hasChanged = t.name !== taskForm.name || t.completed !== taskForm.completed;
        if (!hasChanged) {
          setEditingTaskId(null);
          return t;
        }
        const originalName = t.originalName || t.name;
        const originalCompleted = t.originalCompleted !== undefined ? t.originalCompleted : t.completed;

        const newHistoryItem = {
          editedAt: new Date().toISOString(),
          prevName: t.name,
          prevCompleted: t.completed,
          reason: taskForm.reason || 'Szybka edycja'
        };

        const updatedHistory = t.editHistory ? [...t.editHistory, newHistoryItem] : [newHistoryItem];

        return {
          ...t,
          name: taskForm.name,
          completed: taskForm.completed,
          originalName,
          originalCompleted,
          editHistory: updatedHistory
        };
      }
      return t;
    }));
    setEditingTaskId(null);
  };

  const deleteTask = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to zadanie? Usunięte zostaną także powiązane logi czasowe.')) {
      setTasks(curr => curr.filter(t => t.id !== id));
      setLogs(curr => curr.filter(l => l.taskId !== id));
    }
  };

  return (
    <CollapsibleCard
      title={`tasks table (${tasks.length} ${translate(locale, 'dynamic.recordsPlural', customTranslations)})`}
      icon={Database}
      iconColor="text-teal-400"
      titleColor="text-teal-400"
      defaultExpanded={true}
      wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-teal-400"
    >
      <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs font-mono text-left whitespace-nowrap">
          <thead>
            <tr className={`border-b ${themeClasses.tableHeader} uppercase text-[10px] tracking-wide`}>
              <th className="py-3 px-4 rounded-l-xl">id</th>
              <th className="py-3 px-4">project_id</th>
              <th className="py-3 px-4">name</th>
              <th className="py-3 px-4">completed</th>
              <th className="py-3 px-4">{translate(locale, 'dynamic.originalValue', customTranslations)}</th>
              <th className="py-3 px-4 rounded-r-xl text-right">{translate(locale, 'dbExplorer.actions', customTranslations)}</th>
            </tr>
          </thead>
          <tbody className="dark:text-white">
            {tasks.map(t => {
              const isEditing = editingTaskId === t.id;
              const hasHistory = !!(t.originalName || t.originalCompleted !== undefined || t.editHistory);

              return (
                <React.Fragment key={t.id}>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3.5 px-4 font-bold text-teal-400">{t.id}</td>
                    <td className="py-3.5 px-4 text-slate-400">{t.projectId}</td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={taskForm.name} 
                          onChange={e => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded max-w-sm text-white"
                        />
                      ) : (
                        <span className={t.completed ? 'line-through text-slate-500' : 'font-semibold'}>{t.name}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input 
                          type="checkbox" 
                          checked={taskForm.completed} 
                          onChange={e => setTaskForm(prev => ({ ...prev, completed: e.target.checked }))}
                          className="w-4 h-4 rounded accent-teal-500"
                        />
                      ) : (
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${t.completed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}>
                          {t.completed ? 'TRUE' : 'FALSE'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {hasHistory ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-md font-bold">
                          Oryg: {t.originalName || t.name} ({t.originalCompleted ? 'Gotowe' : 'W toku'})
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">{translate(locale, 'dynamic.noPatches', customTranslations)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasHistory && (
                          <button 
                            onClick={() => setShowHistoryRecordId(showHistoryRecordId === t.id ? null : t.id)}
                            className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isEditing ? (
                          <>
                            <input 
                              type="text" 
                              placeholder="Powód (reason)" 
                              value={taskForm.reason} 
                              onChange={e => setTaskForm(prev => ({ ...prev, reason: e.target.value }))}
                              className="text-[9px] bg-black/45 border border-white/10 px-1 py-0.5 rounded w-28 text-white mr-1"
                            />
                            <button onClick={() => saveEditTask(t.id)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingTaskId(null)} className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditTask(t)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteTask(t.id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {showHistoryRecordId === t.id && t.editHistory && (
                    <tr>
                      <td colSpan={6} className="py-3 px-5 bg-black/20 border-b border-white/5 rounded-b-2xl">
                        <div className="flex flex-col gap-1.2 border-l-2 border-teal-500 pl-4 py-1">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
                            <History className="w-3" /> Audit rewizji zadania
                          </p>
                          {t.editHistory.map((h, hIdx) => (
                            <div key={hIdx} className="text-[11px] text-slate-400 mt-1">
                              <span className="text-slate-500">[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                              {translate(locale, 'dbExplorer.originalPrevName', customTranslations)} <strong className="text-white">"{h.prevName}"</strong> ({translate(locale, 'dbExplorer.completed', customTranslations)} {h.prevCompleted ? translate(locale, 'dbExplorer.yes', customTranslations) : translate(locale, 'dbExplorer.no', customTranslations)}) &rarr;{' '}
                              {translate(locale, 'dbExplorer.reasonForCorrection', customTranslations)} <em className="text-teal-350">"{h.reason}"</em>
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
