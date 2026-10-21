import { useState } from 'react';
import { Database, Plus } from 'lucide-react';
import { TimeLog } from '@bindings/TimeLog';
import CollapsibleCard from '@components/CollapsibleCard';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { translate } from '@common/i18n/translator';
import { getNextId } from '@common/utils/idGenerator';
import AddLogForm from './AddLogForm';
import TimeLogTableRow from './TimeLogTableRow';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { Button } from '@components/ui/button';
import { Caption } from '@components/ui/typography';

export default function TimeLogsTable() {
  const { locale, customTranslations } = useLocale();
  const { tasks, projects, logs, handleEditTimeLog, handleDeleteTimeLog, handleInsertTimeLog } = useData();
  const { showToast } = useWindowShell();

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);
  const [showAddLogForm, setShowAddLogForm] = useState(false);
  const [deleteTargetLogId, setDeleteTargetLogId] = useState<string | null>(null);

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
        showToast(err instanceof Error ? err.message : 'Error while saving');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetLogId) return;
    const id = deleteTargetLogId;
    setDeleteTargetLogId(null);
    try {
      await handleDeleteTimeLog(id);
    } catch (err) {
      if (showToast) {
        showToast(err instanceof Error ? err.message : 'Error while deleting time log');
      }
    }
  };

  const handleManualAddLog = async (taskId: string, startTime: string, endTime: string, note: string) => {
    const selectedTask = tasks.find(t => t.id === taskId);
    if (!selectedTask) return;

    const finalEndTime = endTime.trim() === '' ? null : endTime;
    const newLogId = getNextId(logs, 'log_man_');

    try {
      await handleInsertTimeLog(newLogId, taskId, startTime, finalEndTime, note || 'Manual time registration');
      setShowAddLogForm(false);
    } catch (err) {
      if (showToast) {
        showToast(err instanceof Error ? err.message : 'Error inserting time log');
      }
    }
  };

  const columns: DataTableColumn<TimeLog>[] = [
    { key: 'id', header: 'id' },
    { key: 'taskId', header: 'task_id' },
    { key: 'startTime', header: translate(locale, 'database', 'StartStamp', customTranslations) },
    { key: 'endTime', header: translate(locale, 'database', 'EndStamp', customTranslations) },
    { key: 'note', header: 'note' },
    { key: 'originalStamps', header: translate(locale, 'database', 'OriginalStamps', customTranslations) },
    { key: 'actions', header: translate(locale, 'common', 'Actions', customTranslations), align: 'right' },
  ];

  return (
    <>
      <CollapsibleCard
      title={`time_logs table (${logs.length} ${translate(locale, 'database', 'Records', customTranslations)})`}
      icon={Database}
      iconColor="text-indigo-400"
      titleColor="text-indigo-400"
      defaultExpanded={true}
      wrapperClassName="p-6 rounded-3xl border border-border bg-card shadow-xl"
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 text-left"
      headerRight={
        <Button
          variant="accent"
          size="sm"
          onClick={() => setShowAddLogForm(!showAddLogForm)}
          className="rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> {translate(locale, 'database', 'AddLogManually', customTranslations)}
        </Button>
      }
    >
      <Caption size="xs" className="mb-4 mt-0.5 block">{translate(locale, 'database', 'EntriesCrucialLabel', customTranslations)}</Caption>

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

      <DataTable<TimeLog>
        columns={columns}
        data={logs}
        keyExtractor={(l) => l.id}
        maxHeight="400px"
        className="text-xs font-mono"
        renderRow={(l) => (
          <TimeLogTableRow
            key={l.id}
            l={l}
            isEditing={editingLogId === l.id}
            onStartEdit={() => setEditingLogId(l.id)}
            onSaveEdit={(startTime, endTime, note, reason) => handleSaveEdit(l.id, startTime, endTime, note, reason)}
            onCancelEdit={() => setEditingLogId(null)}
            onDelete={() => setDeleteTargetLogId(l.id)}
            locale={locale}
            customTranslations={customTranslations}
            showHistory={showHistoryRecordId === l.id}
            onToggleHistory={() => setShowHistoryRecordId(showHistoryRecordId === l.id ? null : l.id)}
          />
        )}
      />
    </CollapsibleCard>

    <ConfirmDialog
      open={deleteTargetLogId !== null}
      onOpenChange={(open) => !open && setDeleteTargetLogId(null)}
      title={translate(locale, 'database', 'DeleteConfirmLog', customTranslations)}
      variant="destructive"
      confirmLabel={translate(locale, 'common', 'Delete', customTranslations)}
      cancelLabel={translate(locale, 'common', 'Cancel', customTranslations)}
      onConfirm={handleConfirmDelete}
    />
  </>
  );
}
