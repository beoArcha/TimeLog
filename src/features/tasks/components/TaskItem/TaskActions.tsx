import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { Button } from '@components/ui/button';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { Text, Caption } from '@components/ui/typography';
import { VStack } from '@components/ui/stack';

export interface TaskActionsProps {
  taskId: string;
  taskName: string;
  deleteTitle: string;
  pencilSize: string;
  trashSize: string;
  onDeleteTask: ((id: string) => void) | undefined;
  setEditingId: (id: string | null) => void;
  setEditName: (name: string) => void;
  subtasksCount?: number;
  timeLogsCount?: number;
  isSubtask?: boolean;
}

export function TaskActions({
  taskId,
  taskName,
  deleteTitle,
  pencilSize,
  trashSize,
  onDeleteTask,
  setEditingId,
  setEditName,
  subtasksCount = 0,
  timeLogsCount = 0,
  isSubtask = false,
}: TaskActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { t: tCommon } = useTranslation('common');
  const { t: tTask } = useTranslation('task');

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteTask?.(taskId);
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="opacity-100 md:opacity-0 md:group-hover/taskedit:opacity-100 flex items-center transition duration-200 shrink-0 ml-2">
        <Button
          id={`edit-task-btn-${taskId}`}
          type="button"
          variant="ghost"
          size="icon-xs"
          title={tCommon('EditName')}
          aria-label={tCommon('EditName')}
          onClick={(e) => {
            e.stopPropagation();
            setEditingId(taskId);
            setEditName(taskName);
          }}
          className="p-1 rounded text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 cursor-pointer"
        >
          <Pencil className={pencilSize} />
        </Button>
        <Button
          id={`delete-task-btn-${taskId}`}
          type="button"
          variant="ghost"
          size="icon-xs"
          title={deleteTitle}
          aria-label={deleteTitle}
          onClick={(e) => {
            e.stopPropagation();
            setIsConfirmOpen(true);
          }}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-0.5 cursor-pointer"
        >
          <Trash2 className={trashSize} />
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        variant="destructive"
        loading={isDeleting}
        title={isSubtask ? tTask('ConfirmDeleteSubtaskTitle') : tTask('ConfirmDeleteTaskTitle')}
        confirmLabel={tCommon('Delete')}
        cancelLabel={tCommon('Cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      >
        <VStack gap="xs" className="text-left mt-1">
          <Text size="sm" weight="semibold" className="text-foreground">
            {taskName}
          </Text>
          {subtasksCount > 0 && (
            <Caption variant="destructive">
              {tTask('DeleteTaskWarningSubtasks').replace('{count}', String(subtasksCount))}
            </Caption>
          )}
          {timeLogsCount > 0 && (
            <Caption variant="warning">
              {tTask('DeleteTaskWarningLogs').replace('{count}', String(timeLogsCount))}
            </Caption>
          )}
        </VStack>
      </ConfirmDialog>
    </>
  );
}
