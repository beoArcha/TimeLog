import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { Task } from '@bindings/Task';
import CollapsibleCard from '@components/CollapsibleCard';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { TableRow, TableCell } from '@components/ui/table';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Caption, Overline } from '@components/ui/typography';

export default function TasksTable() {
  const { locale, customTranslations } = useLocale();
  const { tasks, handleUpdateTask, handleDeleteTask } = useData();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<{ name: string; completed: boolean; reason: string }>({ name: '', completed: false, reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);
  const [deleteTargetTaskId, setDeleteTargetTaskId] = useState<string | null>(null);

  const startEditTask = (t: Task) => {
    setEditingTaskId(t.id);
    setTaskForm({ name: t.name, completed: t.completed, reason: 'Task status/name correction' });
  };

  const saveEditTask = async (id: string) => {
    const t = tasks.find(task => task.id === id);
    if (!t) return;
    const hasChanged = t.name !== taskForm.name || t.completed !== taskForm.completed;
    if (!hasChanged) {
      setEditingTaskId(null);
      return;
    }
    if (handleUpdateTask) {
      await handleUpdateTask(id, {
        name: taskForm.name,
        completed: taskForm.completed,
      });
    }
    setEditingTaskId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetTaskId) return;
    const id = deleteTargetTaskId;
    setDeleteTargetTaskId(null);
    if (handleDeleteTask) {
      await handleDeleteTask(id);
    }
  };

  const columns: DataTableColumn<Task>[] = [
    { key: 'id', header: 'id' },
    { key: 'projectId', header: 'project_id' },
    { key: 'name', header: 'name' },
    { key: 'completed', header: 'completed' },
    { key: 'originalValue', header: translate(locale, 'database', 'OriginalValue', customTranslations) },
    { key: 'actions', header: translate(locale, 'common', 'Actions', customTranslations), align: 'right' },
  ];

  return (
    <>
      <CollapsibleCard
      title={`${translate(locale, 'database', 'TasksTableTitle', customTranslations)} (${tasks.length} ${translate(locale, 'database', 'RecordsPlural', customTranslations)})`}
      icon={Database}
      iconColor="text-primary"
      titleColor="text-primary"
      defaultExpanded={true}
      wrapperClassName="p-6 rounded-3xl border border-border bg-card shadow-xl"
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-primary"
    >
      <DataTable<Task>
        columns={columns}
        data={tasks}
        keyExtractor={(t) => t.id}
        maxHeight="400px"
        className="text-xs font-mono"
        renderRow={(t) => {
          const isEditing = editingTaskId === t.id;
          const hasHistory = !!(t.originalName || t.originalCompleted !== undefined || t.editHistory);

          return (
            <React.Fragment key={t.id}>
              <TableRow className="border-b border-border/50 hover:bg-muted/50">
                <TableCell className="py-3.5 px-4 font-bold text-primary">{t.id}</TableCell>
                <TableCell className="py-3.5 px-4 text-muted-foreground">{t.projectId}</TableCell>
                <TableCell className="py-3.5 px-4">
                  {isEditing ? (
                    <Input 
                      type="text" 
                      value={taskForm.name} 
                      onChange={e => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                      aria-label={translate(locale, 'task', 'TaskName', customTranslations)}
                      className="bg-background border border-border px-2 py-1 h-7 rounded max-w-sm text-foreground"
                    />
                  ) : (
                    <span className={t.completed ? 'line-through text-muted-foreground' : 'font-semibold'}>{t.name}</span>
                  )}
                </TableCell>
                <TableCell className="py-3.5 px-4">
                  {isEditing ? (
                    <Checkbox 
                      checked={taskForm.completed} 
                      onCheckedChange={val => setTaskForm(prev => ({ ...prev, completed: Boolean(val) }))}
                      aria-label={translate(locale, 'database', 'Completed', customTranslations)}
                      className="w-4 h-4 rounded"
                    />
                  ) : (
                    <Badge variant={t.completed ? 'success' : 'destructive'} size="xs" as="span">
                      {t.completed ? 'TRUE' : 'FALSE'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-3.5 px-4">
                  {hasHistory ? (
                    <Badge variant="amber" size="sm" as="span">
                      {translate(locale, 'database', 'OriginalLabel', customTranslations)}: {t.originalName || t.name} ({t.originalCompleted ? translate(locale, 'common', 'Yes', customTranslations) : translate(locale, 'common', 'No', customTranslations)})
                    </Badge>
                  ) : (
                    <Caption as="span">{translate(locale, 'database', 'NoPatches', customTranslations)}</Caption>
                  )}
                </TableCell>
                <TableCell className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {hasHistory && (
                      <Button 
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setShowHistoryRecordId(showHistoryRecordId === t.id ? null : t.id)}
                        className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
                        title={translate(locale, 'database', 'RevisionHistory', customTranslations)}
                        aria-label={translate(locale, 'database', 'RevisionHistory', customTranslations)}
                      >
                        <History className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {isEditing ? (
                      <>
                        <Input 
                          type="text" 
                          placeholder={translate(locale, 'database', 'Reason', customTranslations)}
                          aria-label={translate(locale, 'database', 'Reason', customTranslations)}
                          value={taskForm.reason} 
                          onChange={e => setTaskForm(prev => ({ ...prev, reason: e.target.value }))}
                          className="text-xs bg-background border border-border px-1.5 py-0.5 h-6 rounded w-28 text-foreground mr-1"
                        />
                        <Button 
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => saveEditTask(t.id)} 
                          className="p-1.5 rounded-lg bg-success/20 hover:bg-success/30 text-success cursor-pointer"
                          title={translate(locale, 'common', 'Save', customTranslations)}
                          aria-label={translate(locale, 'common', 'Save', customTranslations)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditingTaskId(null)} 
                          className="p-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive cursor-pointer"
                          title={translate(locale, 'common', 'Cancel', customTranslations)}
                          aria-label={translate(locale, 'common', 'Cancel', customTranslations)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => startEditTask(t)} 
                          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                          title={translate(locale, 'common', 'Edit', customTranslations)}
                          aria-label={translate(locale, 'common', 'Edit', customTranslations)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTargetTaskId(t.id)} 
                          className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive cursor-pointer"
                          title={translate(locale, 'common', 'Delete', customTranslations)}
                          aria-label={translate(locale, 'common', 'Delete', customTranslations)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>

              {showHistoryRecordId === t.id && t.editHistory && (
                <TableRow>
                  <TableCell colSpan={6} className="py-3 px-5 bg-muted/30 border-b border-border/50 rounded-b-2xl">
                    <div className="flex flex-col gap-1.2 border-l-2 border-primary pl-4 py-1">
                      <Overline className="text-primary flex items-center gap-1.5">
                        <History className="w-3" /> {translate(locale, 'database', 'AuditTrail', customTranslations)}
                      </Overline>
                      {t.editHistory.map((h, hIdx) => (
                        <Caption key={hIdx} size="xs" className="text-muted-foreground mt-1 block">
                          <span>[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                          {translate(locale, 'database', 'OriginalPrevName', customTranslations)} <strong className="text-foreground">"{h.prevName}"</strong> ({translate(locale, 'database', 'Completed', customTranslations)} {h.prevCompleted ? translate(locale, 'common', 'Yes', customTranslations) : translate(locale, 'common', 'No', customTranslations)}) &rarr;{' '}
                          {translate(locale, 'database', 'ReasonForCorrection', customTranslations)} <em className="text-foreground">"{h.reason}"</em>
                        </Caption>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        }}
      />
    </CollapsibleCard>

    <ConfirmDialog
      open={deleteTargetTaskId !== null}
      onOpenChange={(open) => !open && setDeleteTargetTaskId(null)}
      title={translate(locale, 'database', 'DeleteConfirmTask', customTranslations)}
      variant="destructive"
      confirmLabel={translate(locale, 'common', 'Delete', customTranslations)}
      cancelLabel={translate(locale, 'common', 'Cancel', customTranslations)}
      onConfirm={handleConfirmDelete}
    />
  </>
  );
}
