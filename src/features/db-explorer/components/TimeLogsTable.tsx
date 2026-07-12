import React, { useState } from 'react';
import { Database, Plus } from 'lucide-react';
import { TimeLog } from '@bindings/TimeLog';
import CollapsibleCard from '@components/CollapsibleCard'; // Wait, let's make sure of the path to CollapsibleCard later, but for now we'll use @common/components/CollapsibleCard since we will move it there.
import { useOxyFlow } from '@common/hooks/OxyContext';
import { translate } from '@common/i18n/i18n';
import { LocalStorageDataManager } from '@/src/plugins/persistence/DataManager';
import { STORAGE_KEYS } from '@common/constants';
import AddLogForm from './AddLogForm';
import TimeLogTableRow from './TimeLogTableRow';

const dm = new LocalStorageDataManager(STORAGE_KEYS.STATE_DB);

export default function TimeLogsTable() {
  const {
    tasks, projects,
    logs, setLogs,
    locale, customTranslations, resolvedTheme,
    handleEditTimeLog, showToast
  } = useOxyFlow();

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);
  const [showAddLogForm, setShowAddLogForm] = useState(false);

  const themeClasses = resolvedTheme === 'light'
    ? { wrapper: 'bg-white border-slate-200 shadow-slate-100', tableHeader: 'border-slate-200 text-slate-500 bg-slate-100/50' }
    : resolvedTheme === 'high-contrast'
      ? { wrapper: 'bg-black border-white border-2', tableHeader: 'border-white text-white' }
      : { wrapper: 'bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', tableHeader: 'border-white/10 text-slate-400 bg-black/30' };

  const handleSaveEdit = async (id: string, startTime: string, endTime: string, note: string, reason: string) => {
    const existingLog = logs.find(l => l.id === id);
    if (!existingLog) return;

    const finalEndTime = endTime.trim() === '' ? null : endTime;
    const finalNote = note.trim() === '' ? null : note;
    
    const hasChanged = existingLog.startTime !== startTime || 
                       (existingLog.endTime || '') !== (finalEndTime || '') || 
                       (existingLog.note || '') !== (finalNote || '');
                       
    if (!hasChanged) {
      setEditingLogId(null);
      return;
    }

    try {
      await handleEditTimeLog(id, existingLog.taskId, startTime, finalEndTime, finalNote, reason);
      setEditingLogId(null);
    } catch (err) {
      if (showToast) {
        showToast(err instanceof Error ? err.message : 'Wystąpił błąd podczas zapisu');
      }
    }
  };

  const handleDeleteLog = (id: string) => {
    if (confirm('Czy na pewno chcesz bezpowrotnie skasować ten log czasowy?')) {
      setLogs(curr => curr.filter(l => l.id !== id));
    }
  };

  const handleManualAddLog = (taskId: string, startTime: string, endTime: string, note: string) => {
    const selectedTask = tasks.find(t => t.id === taskId);
    if (!selectedTask) return;

    const finalEndTime = endTime.trim() === '' ? null : endTime;

    const newLog: TimeLog = {
      id: dm.getNextId(logs, 'log_man_'),
      taskId,
      projectId: selectedTask.projectId,
      startTime,
      endTime: finalEndTime,
      note: note || 'Ręczna rejestracja czasu'
    };

    setLogs(curr => [...curr, newLog]);
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
          onClick={() => setShowAddLogForm(!showAddLogForm)}
          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
        >
          <Plus className="w-3.5 h-3.5" /> {translate(locale, 'dynamic.addLogManually', customTranslations)}
        </button>
      }
    >
      <p className="text-[11px] text-slate-400 mb-4 mt-0.5">{translate(locale, 'dynamic.entriesCrucialLabel', customTranslations)}</p>

      {showAddLogForm && (
        <AddLogForm
          tasks={tasks}
          projects={projects}
          locale={locale}
          customTranslations={customTranslations}
          onSubmit={handleManualAddLog}
          onCancel={() => setShowAddLogForm(false)}
        />
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
            {logs.map(l => (
              <TimeLogTableRow
                key={l.id}
                l={l}
                isEditing={editingLogId === l.id}
                onStartEdit={() => setEditingLogId(l.id)}
                onSaveEdit={(startTime, endTime, note, reason) => handleSaveEdit(l.id, startTime, endTime, note, reason)}
                onCancelEdit={() => setEditingLogId(null)}
                onDelete={() => handleDeleteLog(l.id)}
                locale={locale}
                customTranslations={customTranslations}
                showHistory={showHistoryRecordId === l.id}
                onToggleHistory={() => setShowHistoryRecordId(showHistoryRecordId === l.id ? null : l.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  );
}
