import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { Button } from '@components/ui/button';

interface TaskActionsProps {
  taskId: string;
  taskName: string;
  deleteTitle: string;
  pencilSize: string;
  trashSize: string;
  onDeleteTask: ((id: string) => void) | undefined;
  setEditingId: (id: string | null) => void;
  setEditName: (name: string) => void;
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
}: TaskActionsProps) {
  const { t: tCommon } = useTranslation('common');

  return (
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
        className="p-1 rounded text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
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
          if (onDeleteTask) onDeleteTask(taskId);
        }}
        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-0.5"
      >
        <Trash2 className={trashSize} />
      </Button>
    </div>
  );
}
