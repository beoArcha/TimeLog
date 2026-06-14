import React, { useState } from 'react';
import { Database, Trash2, Edit3, Check, X, RefreshCw, Plus, Clock, HelpCircle, History, Info, ChevronDown, ChevronRight } from 'lucide-react';
import CollapsibleCard from './CollapsibleCard';
import { useOxyFlow } from '../hooks/useOxyFlow';
import { Project, Task, TimeLog, HolidayLeave } from '../types';
import { translate } from '../utils/i18n';
import { DataManager } from '../utils/dataManager';

export default function DbExplorer() {
  const { 
    projects, setProjects, 
    tasks, setTasks, 
    logs, setLogs, 
    holidays, setHolidays, 
    patches, setPatches,
    resolvedTheme,
    locale,
    customTranslations
  } = useOxyFlow();

  // Active edit row states
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [projForm, setProjForm] = useState<{ name: string; color: string; reason: string }>({ name: '', color: 'violet', reason: '' });

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<{ name: string; completed: boolean; reason: string }>({ name: '', completed: false, reason: '' });

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<{ startTime: string; endTime: string; note: string; reason: string }>({ startTime: '', endTime: '', note: '', reason: '' });

  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidayForm, setHolidayForm] = useState<{ name: string; date: string; type: 'holiday' | 'leave'; reason: string }>({ name: '', date: '', type: 'holiday', reason: '' });

  // History display toggles per record ID
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);

  // Manual insertions states
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    tasks: true,
    logs: true,
    holidays: true,
    patches: true
  });
  
  const toggleSection = (key: keyof typeof expandedSections) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  const [newLogForm, setNewLogForm] = useState({ taskId: '', startTime: new Date().toISOString(), endTime: new Date().toISOString(), note: '' });

  const colors = ['rose', 'teal', 'amber', 'violet', 'indigo', 'emerald'];

  const handleExportDatabase = () => {
    const data = { projects, tasks, logs, holidays, patches };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OxyFlow_Backup_${new Date().toISOString().substring(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const themeClasses = resolvedTheme === 'light' 
    ? { wrapper: 'bg-white border-slate-200 shadow-slate-100', textPK: 'text-orange-600', tableHeader: 'border-slate-200 text-slate-500 bg-slate-100/50' }
    : resolvedTheme === 'high-contrast'
    ? { wrapper: 'bg-black border-white border-2', textPK: 'text-amber-400', tableHeader: 'border-white text-white' }
    : { wrapper: 'bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', textPK: 'text-orange-400', tableHeader: 'border-white/10 text-slate-400 bg-black/30' };

  // --- Project Actions ---
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

        // Preserve originals
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

  // --- Task Actions ---
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

  // --- TimeLog Actions ---
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

  // --- Holiday/Leave Actions ---
  const startEditHoliday = (h: HolidayLeave) => {
    setEditingHolidayId(h.id);
    setHolidayForm({ name: h.name, date: h.date, type: h.type, reason: 'Korekta kalendarium' });
  };

  const saveEditHoliday = (id: string) => {
    setHolidays(curr => curr.map(h => {
      if (h.id === id) {
        const hasChanged = h.name !== holidayForm.name || h.date !== holidayForm.date || h.type !== holidayForm.type;
        if (!hasChanged) {
          setEditingHolidayId(null);
          return h;
        }

        const originalName = h.originalName || h.name;
        const originalDate = h.originalDate || h.date;
        const originalType = h.originalType || h.type;

        const newHistoryItem = {
          editedAt: new Date().toISOString(),
          prevName: h.name,
          prevDate: h.date,
          prevType: h.type,
          reason: holidayForm.reason || 'Poprawka w kalendarzu'
        };

        const updatedHistory = h.editHistory ? [...h.editHistory, newHistoryItem] : [newHistoryItem];

        return {
          ...h,
          name: holidayForm.name,
          date: holidayForm.date,
          type: holidayForm.type,
          originalName,
          originalDate,
          originalType,
          editHistory: updatedHistory
        };
      }
      return h;
    }));
    setEditingHolidayId(null);
  };

  return (
    <div className="text-left flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-white/5">
        <div>
          <h2 className="text-xl font-heading font-extrabold flex items-center gap-2 dark:text-white">
            <Database className="w-5.5 h-5.5 text-orange-500 animate-pulse" />
            <span>{translate(locale, 'dynamic.dbTitle', customTranslations)}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {translate(locale, 'dynamic.dbDesc', customTranslations)}
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3.5 py-1.5 rounded-xl uppercase font-bold self-start sm:self-auto tracking-wider">
            {translate(locale, 'dynamic.tauriDriver', customTranslations)}
          </span>
          <button
            onClick={handleExportDatabase}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 transition-colors uppercase font-bold tracking-wider"
          >
            {translate(locale, 'dynamic.exportDb', customTranslations)}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* TABELA 1: PROJECTS */}
        <CollapsibleCard
          title={`projects table (${projects.length} ${translate(locale, 'dynamic.records', customTranslations)})`}
          icon={Database}
          iconColor="text-orange-400"
          titleColor="text-orange-400"
          defaultExpanded={true}
          wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-orange-400"
          headerRight={null}
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

                      {/* Expanded Project Revision History nested component */}
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
                                  Zmiana z nazwy: <strong className="text-white">"{h.prevName}"</strong> (kolor: {h.prevColor}) &rarr;{' '}
                                  Powód: <em className="text-teal-350">"{h.reason}"</em>
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

        {/* TABELA 2: TASKS */}
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
                  <th className="py-3 px-4 rounded-r-xl text-right">akcje</th>
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
                                  Oryginał/Poprzednia nazwa: <strong className="text-white">"{h.prevName}"</strong> (ukończone: {h.prevCompleted ? 'TAK' : 'NIE'}) &rarr;{' '}
                                  Powód korekty: <em className="text-teal-350">"{h.reason}"</em>
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

        {/* TABELA 3: TIME_LOGS */}
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

          {/* Quick manual log form */}
          {showAddLogForm && (
            <form onSubmit={handleManualAddLog} className="mb-6 p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col gap-3">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">SQL Command: INSERT INTO time_logs</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Przypisz do zadania:</label>
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
                  <label className="block text-slate-400 mb-1">Rozpoczęcie (startTime):</label>
                  <input 
                    type="text" 
                    value={newLogForm.startTime} 
                    onChange={e => setNewLogForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none select-text" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Zakończenie (endTime lub puste):</label>
                  <input 
                    type="text" 
                    value={newLogForm.endTime} 
                    onChange={e => setNewLogForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none select-text" 
                    placeholder="Wprowadź ISO lub pozostaw puste"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Notatka (note):</label>
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
                  <th className="py-3 px-4">start_stamp (start)</th>
                  <th className="py-3 px-4">end_stamp (koniec)</th>
                  <th className="py-3 px-4">note</th>
                  <th className="py-3 px-4">original stamps (oryginał)</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">akcje</th>
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
                            <span className="text-indigo-400 font-semibold">{l.endTime || 'CZYNNE LICZENIE (TRACKING ACTIVE)'}</span>
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
                            <span className="text-slate-500 text-[10px]">Bez zmian</span>
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
                                <History className="w-3" /> Oryginał i historia korekt wpisu czasowego (Kompensacja bezczynności)
                              </p>
                              {l.editHistory.map((h, hIdx) => (
                                <div key={hIdx} className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  <span className="text-slate-500">[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                                  Oryginał start: <strong className="text-white">"{h.prevStartTime}"</strong> rozbity do końca: "{h.prevEndTime || 'BIEŻĄCY'}". <br />
                                  Notatka przed korektą: "{h.prevNote || 'brak'}" &rarr;{' '}
                                  Powód modyfikacji: <em className="text-emerald-400 font-semibold">"{h.reason}"</em>
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

        {/* TABELA 4: HOLIDAYS_LEAVES */}
        <CollapsibleCard
          title={`holidays_leaves table (${holidays.length} ${translate(locale, 'dynamic.recordsPlural', customTranslations)})`}
          icon={Database}
          iconColor="text-rose-400"
          titleColor="text-rose-400"
          defaultExpanded={true}
          wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-rose-400"
          headerRight={
            <button
              onClick={() => {
                const newEntity: HolidayLeave = { 
                  id: DataManager.getNextId(holidays, 'e'), 
                  date: new Date().toISOString().slice(0, 10), 
                  type: 'holiday', 
                  name: 'Nowe Święto/Dzień wolny' 
                };
                setHolidays(prev => [...prev, newEntity]);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
            >
              {translate(locale, 'dynamic.addLeave', customTranslations)}
            </button>
          }
        >
          <div className="overflow-x-auto w-full max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs font-mono text-left whitespace-nowrap">
              <thead>
                <tr className={`border-b ${themeClasses.tableHeader} uppercase text-[10px] tracking-wide`}>
                  <th className="py-3 px-4 rounded-l-xl">id</th>
                  <th className="py-3 px-4">date</th>
                  <th className="py-3 px-4">type</th>
                  <th className="py-3 px-4">name</th>
                  <th className="py-3 px-4">{translate(locale, 'dynamic.originalValue', customTranslations)}</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">akcje</th>
                </tr>
              </thead>
              <tbody className="dark:text-white">
                {holidays.map(h => {
                  const isEditing = editingHolidayId === h.id;
                  const hasHistory = !!(h.originalName || h.originalDate || h.originalType || h.editHistory);

                  return (
                    <React.Fragment key={h.id}>
                      <tr className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3.5 px-4 font-bold text-slate-400">{h.id}</td>
                        <td className="py-3.5 px-4">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={holidayForm.date} 
                              onChange={e => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                              className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded text-white"
                            />
                          ) : (
                            <span className="font-bold text-orange-500 dark:text-orange-400">{h.date}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isEditing ? (
                            <select 
                              value={holidayForm.type} 
                              onChange={e => setHolidayForm(prev => ({ ...prev, type: e.target.value as any }))}
                              className="bg-black border border-white/20 px-2 py-1 rounded"
                            >
                              <option value="holiday">holiday (święto)</option>
                              <option value="leave">leave (urlop)</option>
                            </select>
                          ) : (
                            <span className="text-indigo-400">{h.type}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={holidayForm.name} 
                              onChange={e => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                              className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded max-w-xs text-white"
                            />
                          ) : (
                            <span>{h.name}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {hasHistory ? (
                            <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-md font-bold">
                              Oryg: {h.originalName || h.name} ({h.originalDate})
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Bez zmian</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {hasHistory && (
                              <button 
                                onClick={() => setShowHistoryRecordId(showHistoryRecordId === h.id ? null : h.id)}
                                className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isEditing ? (
                              <>
                                <input 
                                  type="text" 
                                  placeholder="Powód zmiany" 
                                  value={holidayForm.reason} 
                                  onChange={e => setHolidayForm(prev => ({ ...prev, reason: e.target.value }))}
                                  className="text-[9px] bg-black/45 border border-white/10 px-1 py-0.5 rounded w-28 text-white mr-1"
                                />
                                <button onClick={() => saveEditHoliday(h.id)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingHolidayId(null)} className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditHoliday(h)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setHolidays(prev => prev.filter(x => x.id !== h.id))} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {showHistoryRecordId === h.id && h.editHistory && (
                        <tr>
                          <td colSpan={6} className="py-3 px-5 bg-black/20 border-b border-white/5 rounded-b-2xl">
                            <div className="flex flex-col gap-1.2 border-l-2 border-teal-500 pl-4 py-1">
                              <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
                                <History className="w-3" /> Audit historii świąt/urlopów
                              </p>
                              {h.editHistory.map((x, idx) => (
                                <div key={idx} className="text-[11px] text-slate-400 mt-1">
                                  <span className="text-slate-500">[{new Date(x.editedAt).toLocaleString()}]</span>{' '}
                                  Modyfikacja z: <strong className="text-white">"{x.prevName}"</strong> ({x.prevDate}, typ: {x.prevType}) &rarr;{' '}
                                  Powód modyfikacji: <em className="text-teal-350">"{x.reason}"</em>
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

        {/* TABELA 4: PATCH_LOGS */}
        <CollapsibleCard
          title={`patch_logs table (${patches?.length || 0} ${translate(locale, 'dynamic.records', customTranslations)})`}
          icon={Database}
          iconColor="text-emerald-400"
          titleColor="text-emerald-400"
          defaultExpanded={true}
          wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
          headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 text-left"
          headerRight={
            <button
              onClick={() => {
                const start = prompt("Podaj czas startowy (YYYY-MM-DDTHH:mm:ss.sssZ):", new Date().toISOString());
                const end = prompt("Podaj czas końcowy (YYYY-MM-DDTHH:mm:ss.sssZ):", new Date(Date.now() + 3600000).toISOString());
                const note = prompt("Powód łatki (patchNote):", "Korekta po uśpieniu systemu");
                if (start && end && projects.length > 0) {
                  setPatches(prev => [...prev, {
                    id: DataManager.getNextId(patches, 'patch_'),
                    projectId: projects[0].id,
                    startTime: start,
                    endTime: end,
                    patchNote: note || 'Korekta manualna'
                  }]);
                }
              }}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
            >
              <Plus className="w-3.5 h-3.5" />
              {translate(locale, 'dynamic.addManualPatch', customTranslations)}
            </button>
          }
        >
          <p className="text-[11px] text-slate-400 mb-4 mt-0.5">{translate(locale, 'dynamic.patchTableAllows', customTranslations)}</p>
          
          <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs font-mono text-left whitespace-nowrap">
              <thead>
                <tr className={`border-b ${themeClasses.tableHeader} uppercase text-[10px] tracking-wide`}>
                  <th className="py-3 px-4 rounded-l-xl">id</th>
                  <th className="py-3 px-4">project_id</th>
                  <th className="py-3 px-4">task_id (opt)</th>
                  <th className="py-3 px-4">start_time</th>
                  <th className="py-3 px-4">end_time</th>
                  <th className="py-3 px-4">patch_note / reason</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">actions</th>
                </tr>
              </thead>
              <tbody className="dark:text-white">
                {(patches || []).map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{p.id}</td>
                    <td className="py-3.5 px-4">{p.projectId}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.taskId || 'NULL'}</td>
                    <td className="py-3.5 px-4 border-l border-white/5">{new Date(p.startTime).toLocaleString()}</td>
                    <td className="py-3.5 px-4">{new Date(p.endTime).toLocaleString()}</td>
                    <td className="py-3.5 px-4 italic text-slate-400">{p.patchNote} {p.isSystemEvent && <span className="text-emerald-500 font-bold ml-1">[SYSTEM]</span>}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => {
                        if (confirm('Usunąć tę łatkę z bazy?')) {
                          setPatches(curr => curr.filter(x => x.id !== p.id));
                        }
                      }} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {(patches || []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 italic">{translate(locale, 'dynamic.noPatchesOperatingStandard', customTranslations)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleCard>

      </div>
    </div>
  );
}
