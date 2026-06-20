import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History, Plus } from 'lucide-react';
import { TimeLog } from '../../../bindings/TimeLog';
import CollapsibleCard from '../../shared/CollapsibleCard';
import { useOxyFlow } from '../../../hooks/useOxyFlow';
import { translate } from '../../../utils/i18n';
import { DataManager } from '../../../utils/dataManager';

export default function TimeLogsTable() {
  const { 
    tasks, projects, 
    logs, setLogs, 
    locale, customTranslations, resolvedTheme 
  } = useOxyFlow();

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<{ startTime: string; endTime: string; note: string; reason: string }>({ startTime: '', endTime: '', note: '', reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);

  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [newLogForm, setNewLogForm] = useState({ taskId: '', startTime: new Date().toISOString(), endTime: new Date().toISOString(), note: '' });

  const themeClasses = resolvedTheme === 'light' 
    ? { wrapper: 'bg-white border-slate-200 shadow-slate-100', tableHeader: 'border-slate-200 text-slate-500 bg-slate-100/50' }
    : resolvedTheme === 'high-contrast'
    ? { wrapper: 'bg-black border-white border-2', tableHeader: 'border-white text-white' }
    : { wrapper: 'bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', tableHeader: 'border-white/10 text-slate-400 bg-black/30' };

  const startEditLog = (l: TimeLog) => {
    setEditingLogId(l.id);
    setLogForm({ 
      startTime: l.startTime, 
      endTime: l.endTime || '', 
      note: l.note || '', 
      reason: 'Błąd synchronizacji licznika / Korekta ręczna' 
    });
  };

  const saveEditLog = (id: string) => {
    setLogs(curr => curr.map(l => {
      if (l.id === id) {
        const finalEndTime = logForm.endTime.trim() === '' ? null : logForm.endTime;
        const hasChanged = l.startTime !== logForm.startTime || l.endTime !== finalEndTime || (l.note || '') !== logForm.note;
        if (!hasChanged) {
          setEditingLogId(null);
          return l;
        }

        const originalStartTime = l.originalStartTime || l.startTime;
        const originalEndTime = l.originalEndTime !== undefined ? l.originalEndTime : l.endTime;
        const originalNote = l.originalNote !== undefined ? l.originalNote : l.note || '';

        const newHistoryItem = {
          editedAt: new Date().toISOString(),
          prevStartTime: l.startTime,
          prevEndTime: l.endTime,
          prevNote: l.note,
          reason: logForm.reason || 'Korekta ręczna wpisu'
        };

        const updatedHistory = l.editHistory ? [...l.editHistory, newHistoryItem] : [newHistoryItem];

        return {
          ...l,
          startTime: logForm.startTime,
          endTime: finalEndTime,
          note: logForm.note,
          originalStartTime,
          originalEndTime,
          originalNote,
          editHistory: updatedHistory
        };
      }
      return l;
    }));
    setEditingLogId(null);
  };

  const deleteLog = (id: string) => {
    if (confirm('Czy na pewno chcesz bezpowrotnie skasować ten log czasowy?')) {
      setLogs(curr => curr.filter(l => l.id !== id));
    }
  };

  const handleManualAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogForm.taskId) {
      alert('Najpierw wybierz zadanie!');
      return;
    }
    const selectedTask = tasks.find(t => t.id === newLogForm.taskId);
    if (!selectedTask) return;

    const finalEndTime = newLogForm.endTime.trim() === '' ? null : newLogForm.endTime;

    const newLog: TimeLog = {
      id: DataManager.getNextId(logs, 'log_man_'),
      taskId: newLogForm.taskId,
      projectId: selectedTask.projectId,
      startTime: newLogForm.startTime,
      endTime: finalEndTime,
      note: newLogForm.note || 'Ręczna rejestracja czasu'
    };

    setLogs(curr => [...curr, newLog]);
    setNewLogForm({ taskId: '', startTime: new Date().toISOString(), endTime: new Date().toISOString(), note: '' });
    setShowAddLogForm(false);
  };

  return (
    <CollapsibleCard
      title={`time_logs table (${logs.length} ${translate(locale, 'dynamic.records', customTranslations)})`}
      icon={Database}
      iconColor="text-indigo-400"
      titleColor="text-indigo-400"
      defaultExpanded={true}
      wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 text-left"
      headerRight={
        <button
          onClick={() => {
            setShowAddLogForm(!showAddLogForm);
            if (tasks.length > 0) {
              setNewLogForm(prev => ({ ...prev, taskId: tasks[0].id }));
            }
          }}
          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
        >
          <Plus className="w-3.5 h-3.5" /> {translate(locale, 'dynamic.addLogManually', customTranslations)}
        </button>
      }
    >
      <p className="text-[11px] text-slate-400 mb-4 mt-0.5">{translate(locale, 'dynamic.entriesCrucialLabel', customTranslations)}</p>

      {showAddLogForm && (
        <form onSubmit={handleManualAddLog} className="mb-6 p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col gap-3">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">SQL Command: INSERT INTO time_logs</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">{translate(locale, 'dbExplorer.assignToTask', customTranslations)}</label>
              <select 
                value={newLogForm.taskId} 
                onChange={e => setNewLogForm(prev => ({ ...prev, taskId: e.target.value }))}
                className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none"
                required
              >
                <option value="">{translate(locale, 'dynamic.selectTask', customTranslations)}</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{projects.find(p=>p.id===t.projectId)?.name} &gt; {t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{translate(locale, 'dbExplorer.startTime', customTranslations)}</label>
              <input 
                type="text" 
                value={newLogForm.startTime} 
                onChange={e => setNewLogForm(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none select-text" 
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{translate(locale, 'dbExplorer.endTime', customTranslations)}</label>
              <input 
                type="text" 
                value={newLogForm.endTime} 
                onChange={e => setNewLogForm(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none select-text" 
                placeholder="Wprowadź ISO lub pozostaw puste"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">{translate(locale, 'dbExplorer.note', customTranslations)}</label>
              <input 
                type="text" 
                value={newLogForm.note} 
                onChange={e => setNewLogForm(prev => ({ ...prev, note: e.target.value }))}
                className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none placeholder-slate-500" 
                placeholder="np. Dodane wstecznie za wtorek"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-650 text-white font-bold rounded-xl text-xs cursor-pointer">
              Zatwierdź SQL INSERT
            </button>
            <button type="button" onClick={() => setShowAddLogForm(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer">
              Anuluj
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs font-mono text-left whitespace-nowrap">
          <thead>
            <tr className={`border-b ${themeClasses.tableHeader} uppercase text-[10px] tracking-wide`}>
              <th className="py-3 px-4 rounded-l-xl">id</th>
              <th className="py-3 px-4">task_id</th>
              <th className="py-3 px-4">{translate(locale, 'dbExplorer.startStamp', customTranslations)}</th>
              <th className="py-3 px-4">{translate(locale, 'dbExplorer.endStamp', customTranslations)}</th>
              <th className="py-3 px-4">note</th>
              <th className="py-3 px-4">{translate(locale, 'dbExplorer.originalStamps', customTranslations)}</th>
              <th className="py-3 px-4 rounded-r-xl text-right">{translate(locale, 'dbExplorer.actions', customTranslations)}</th>
            </tr>
          </thead>
          <tbody className="dark:text-white">
            {logs.map(l => {
              const isEditing = editingLogId === l.id;
              const hasHistory = !!(l.originalStartTime || l.originalEndTime !== undefined || l.originalNote !== undefined || l.editHistory);

              return (
                <React.Fragment key={l.id}>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3.5 px-4 font-bold text-slate-500">{l.id}</td>
                    <td className="py-3.5 px-4 text-teal-400 font-bold">{l.taskId}</td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={logForm.startTime} 
                          onChange={e => setLogForm(prev => ({ ...prev, startTime: e.target.value }))}
                          className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded text-white"
                        />
                      ) : (
                        <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{l.startTime}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={logForm.endTime} 
                          onChange={e => setLogForm(prev => ({ ...prev, endTime: e.target.value }))}
                          className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded text-white"
                          placeholder="Koniec czasu lub puste"
                        />
                      ) : (
                        <span className="text-indigo-400 font-semibold">{l.endTime || translate(locale, 'dbExplorer.trackingActive', customTranslations)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 truncate max-w-xs">
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={logForm.note} 
                          onChange={e => setLogForm(prev => ({ ...prev, note: e.target.value }))}
                          className="bg-black/35 border border-white/20 px-2 py-1 rounded text-white"
                        />
                      ) : (
                        <span>{l.note || <span className="text-slate-500 italic">{translate(locale, 'dynamic.noNote', customTranslations)}</span>}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {hasHistory ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-md font-bold block w-max">
                          Oryg start: {l.originalStartTime ? new Date(l.originalStartTime).toLocaleTimeString() : 'N/A'}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">{translate(locale, 'dbExplorer.noChanges', customTranslations)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasHistory && (
                          <button 
                            onClick={() => setShowHistoryRecordId(showHistoryRecordId === l.id ? null : l.id)}
                            className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isEditing ? (
                          <>
                            <input 
                              type="text" 
                              placeholder="Uzasadnienie rzetelności" 
                              value={logForm.reason} 
                              onChange={e => setLogForm(prev => ({ ...prev, reason: e.target.value }))}
                              className="text-[9px] bg-black/45 border border-white/10 px-1 py-0.5 rounded w-32 text-white mr-1"
                            />
                            <button onClick={() => saveEditLog(l.id)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingLogId(null)} className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditLog(l)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteLog(l.id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {showHistoryRecordId === l.id && l.editHistory && (
                    <tr>
                      <td colSpan={7} className="py-3 px-5 bg-black/20 border-b border-white/5 rounded-b-2xl">
                        <div className="flex flex-col gap-1.2 border-l-2 border-teal-500 pl-4 py-1">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
                            <History className="w-3" /> Oryginał i historia korekt wpisu czasowego
                          </p>
                          {l.editHistory.map((h, hIdx) => (
                            <div key={hIdx} className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                              <span className="text-slate-500">[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                              Start: <strong className="text-white">"{h.prevStartTime}"</strong>, Koniec: <strong className="text-white">"{h.prevEndTime || 'Brak'}"</strong>, Notatka: <strong className="text-white">"{h.prevNote}"</strong> &rarr;{' '}
                              Uzasadnienie: <em className="text-teal-350">"{h.reason}"</em>
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
