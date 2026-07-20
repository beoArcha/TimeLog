import React from 'react';
import { useTranslation } from '@common/i18n/translator';

interface TaskNameEditorProps {
  taskId: string;
  taskName: string;
  editName: string;
  isEditing: boolean;
  theme: string;
  textSizeClass: string;
  onRenameTask: ((id: string, name: string) => void) | undefined;
  setEditName: (name: string) => void;
  setEditingId: (id: string | null) => void;
}

export function TaskNameEditor({
  taskId,
  taskName,
  editName,
  isEditing,
  theme,
  textSizeClass,
  onRenameTask,
  setEditName,
  setEditingId,
}: TaskNameEditorProps) {
  const { t: tCommon } = useTranslation('common');

  const commitEdit = () => {
    if (onRenameTask && editName.trim() && editName.trim() !== taskName) {
      onRenameTask(taskId, editName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  if (!isEditing) {
    return null;
  }

  return (
    <input
      autoFocus
      value={editName}
      onChange={(e) => setEditName(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={commitEdit}
      onKeyDown={handleKeyDown}
      aria-label={tCommon('EditName')}
      className={`font-semibold ${textSizeClass} rounded px-1 outline-none w-full max-w-sm mr-2 ${theme === 'light'
          ? 'bg-white text-[#2C2421] border-[#DFD7CB]'
          : 'bg-black text-white border-white/20'
        } border`}
    />
  );
}
