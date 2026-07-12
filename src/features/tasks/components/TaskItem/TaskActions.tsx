import { Locale } from '@bindings/Locale';
import { Pencil, Trash2 } from 'lucide-react';
import { translate } from '@common/i18n/i18n';

interface TaskActionsProps {
  taskId: string;
  taskName: string;
  locale: Locale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customTranslations: any;
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
  locale,
  customTranslations,
  deleteTitle,
  pencilSize,
  trashSize,
  onDeleteTask,
  setEditingId,
  setEditName,
}: TaskActionsProps) {
  return (
    <div className="opacity-100 md:opacity-0 md:group-hover/taskedit:opacity-100 flex items-center transition duration-200 shrink-0 ml-2">
      <button
        type="button"
        title={translate(locale, 'common.editName', customTranslations)}
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
        type="button"
        title={deleteTitle}
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
