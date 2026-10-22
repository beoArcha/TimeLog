import React from 'react';
import { useTranslation } from '@common/i18n/translator';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';

import { useTaskEditing } from '../../context/TaskEditingContext';

export interface SubtaskFormProps {
  parentTaskId: string;
  newSubtaskName?: string;
  setNewSubtaskName?: (name: string) => void;
  onSubmit: (parentTaskId: string, e: React.FormEvent) => void;
}

export function SubtaskForm({
  parentTaskId,
  newSubtaskName: propNewSubtaskName,
  setNewSubtaskName: propSetNewSubtaskName,
  onSubmit,
}: SubtaskFormProps) {
  const { t: tTask } = useTranslation('task');
  const { t: tCommon } = useTranslation('common');

  const editingCtx = useTaskEditing();
  const newSubtaskName = propNewSubtaskName ?? editingCtx?.newSubtaskName ?? '';
  const setNewSubtaskName = propSetNewSubtaskName ?? editingCtx?.setNewSubtaskName ?? (() => {});

  return (
    <form
      id={`subtask-form-${parentTaskId}`}
      onSubmit={(e) => onSubmit(parentTaskId, e)}
      className="p-2.5 rounded-2xl border flex gap-2 ml-8 mt-1 bg-muted/40 border-border"
    >
      <Input
        id={`new-subtask-input-${parentTaskId}`}
        type="text"
        required
        placeholder={tTask('EnterSubtaskName')}
        value={newSubtaskName}
        onChange={(e) => setNewSubtaskName(e.target.value)}
        className="flex-1 px-3 py-1.5 border rounded-xl text-xs focus:outline-none transition-all bg-card border-border text-foreground placeholder-muted-foreground"
      />
      <Button
        id={`submit-subtask-btn-${parentTaskId}`}
        type="submit"
        variant="accent"
        size="xs"
        className="text-white text-xs font-semibold rounded-xl px-3 py-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
      >
        {tCommon('Save')}
      </Button>
    </form>
  );
}
