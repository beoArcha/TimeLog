import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { Task } from '@bindings/Task';
import CollapsibleCard from '@components/CollapsibleCard';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Caption, Overline } from '@components/ui/typography';

export default function TasksTable() {
  const { locale, customTranslations } = useLocale();
  const { tasks, setTasks, setLogs, handleDeleteTask } = useData();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<{ name: string; completed: boolean; reason: string }>({ name: '', completed: false, reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);
  const [deleteTargetTaskId, setDeleteTargetTaskId] = useState<string | null>(null);

  const startEditTask = (t: Task) => {
    setEditingTaskId(t.id);
    setTaskForm({ name: t.name, completed: t.completed, reason: 'Task status/name correction' });
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
          reason: taskForm.reason || 'Quick edit'
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

  const handleConfirmDelete = async () => {
    if (!deleteTargetTaskId) return;
    const id = deleteTargetTaskId;
    setDeleteTargetTaskId(null);
    if (handleDeleteTask) {
      await handleDeleteTask(id);
    }
    setTasks(curr => curr.filter(t => t.id !== id));
    setLogs(curr => curr.filter(l => l.taskId !== id));
  };

  return (
    <>
      <CollapsibleCard
      title={`${translate(locale, 'database', 'TasksTableTitle', customTranslations)} (${tasks.length} ${translate(locale, 'database', 'RecordsPlural', customTranslations)})`}
      icon={Database}
      iconColor="text-teal-400"
      titleColor="text-teal-400"
      defaultExpanded={true}
      wrapperClassName="p-6 rounded-3xl border border-border bg-card shadow-xl"
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-teal-400"
    >
      <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto">
        <Table className="w-full text-xs font-mono text-left whitespace-nowrap">
          <TableHeader>
            <TableRow className="border-b border-border text-muted-foreground bg-muted/50 uppercase text-xs tracking-wide">
              <TableHead className="py-3 px-4 rounded-l-xl">id</TableHead>
              <TableHead className="py-3 px-4">project_id</TableHead>
              <TableHead className="py-3 px-4">name</TableHead>
              <TableHead className="py-3 px-4">completed</TableHead>
              <TableHead className="py-3 px-4">{translate(locale, 'database', 'OriginalValue', customTranslations)}</TableHead>
              <TableHead className="py-3 px-4 rounded-r-xl text-right">{translate(locale, 'common', 'Actions', customTranslations)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-foreground">
            {tasks.map(t => {
              const isEditing = editingTaskId === t.id;
              const hasHistory = !!(t.originalName || t.originalCompleted !== undefined || t.editHistory);

              return (
                <React.Fragment key={t.id}>
                  <TableRow className="border-b border-border/50 hover:bg-muted/50">
                    <TableCell className="py-3.5 px-4 font-bold text-teal-400">{t.id}</TableCell>
                    <TableCell className="py-3.5 px-4 text-muted-foreground">{t.projectId}</TableCell>
                    <TableCell className="py-3.5 px-4">
                      {isEditing ? (
                        <Input 
                          type="text" 
                          value={taskForm.name} 
                          onChange={e => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                          aria-label={translate(locale, 'task', 'TaskName', customTranslations)}
                          className="bg-black/35 border border-white/20 px-2 py-1 h-7 rounded max-w-sm text-white"
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
                        <Badge variant={t.completed ? 'emerald' : 'rose'} size="xs" as="span">
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
                            className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
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
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer"
                              title={translate(locale, 'common', 'Save', customTranslations)}
                              aria-label={translate(locale, 'common', 'Save', customTranslations)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditingTaskId(null)} 
                              className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer"
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
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
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
                        <div className="flex flex-col gap-1.2 border-l-2 border-teal-500 pl-4 py-1">
                          <Overline className="text-teal-400 flex items-center gap-1.5">
                            <History className="w-3" /> {translate(locale, 'database', 'AuditTrail', customTranslations)}
                          </Overline>
                          {t.editHistory.map((h, hIdx) => (
                            <Caption key={hIdx} size="xs" className="text-muted-foreground mt-1 block">
                              <span>[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                              {translate(locale, 'database', 'OriginalPrevName', customTranslations)} <strong className="text-foreground">"{h.prevName}"</strong> ({translate(locale, 'database', 'Completed', customTranslations)} {h.prevCompleted ? translate(locale, 'common', 'Yes', customTranslations) : translate(locale, 'common', 'No', customTranslations)}) &rarr;{' '}
                              {translate(locale, 'database', 'ReasonForCorrection', customTranslations)} <em className="text-teal-300">"{h.reason}"</em>
                            </Caption>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
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
