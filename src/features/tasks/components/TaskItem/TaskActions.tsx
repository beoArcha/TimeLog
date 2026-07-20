import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';

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
      <button
        id={`edit-task-btn-${taskId}`}
        type="button"
        title={tCommon('EditName')}
        aria-label={tCommon('EditName')}
        onClick={(e) => {
          e.stopPropagation();
          setEditingId(taskId);
          setEditName(taskName);
        }}
        className="p-1 rounded text-slate-500 hover:text-orange-500 hover:bg-orange-500/10"
      >
        <Pencil className={pencilSize} />
      </button>
      <button
        id={`delete-task-btn-${taskId}`}
        type="button"
        title={deleteTitle}
        aria-label={deleteTitle}
        onClick={(e) => {
          e.stopPropagation();
          if (onDeleteTask) onDeleteTask(taskId);
        }}
        className="p-1 rounded text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 ml-0.5"
      >
        <Trash2 className={trashSize} />
      </button>
    </div>
  );
}
