/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';

export interface ITaskEditingContext {
  editingId: string | null;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  editName: string;
  setEditName: React.Dispatch<React.SetStateAction<string>>;
  showSubtaskFormForId: string | null;
  setShowSubtaskFormForId: React.Dispatch<React.SetStateAction<string | null>>;
  newSubtaskName: string;
  setNewSubtaskName: React.Dispatch<React.SetStateAction<string>>;
  startEditing: (taskId: string, currentName: string) => void;
  cancelEditing: () => void;
}

export const TaskEditingContext = createContext<ITaskEditingContext | null>(null);

export function useTaskEditing(): ITaskEditingContext | null {
  return useContext(TaskEditingContext);
}

export interface TaskEditingProviderProps {
  children: React.ReactNode;
  initialEditingId?: string | null;
  onSetEditingId?: (id: string | null) => void;
  initialEditName?: string;
  onSetEditName?: (name: string) => void;
  initialShowSubtaskFormForId?: string | null;
  onSetShowSubtaskFormForId?: (id: string | null) => void;
  initialNewSubtaskName?: string;
  onSetNewSubtaskName?: (name: string) => void;
}

export function TaskEditingProvider({
  children,
  initialEditingId,
  onSetEditingId,
  initialEditName,
  onSetEditName,
  initialShowSubtaskFormForId,
  onSetShowSubtaskFormForId,
  initialNewSubtaskName,
  onSetNewSubtaskName,
}: TaskEditingProviderProps) {
  const [internalEditingId, setInternalEditingId] = useState<string | null>(initialEditingId ?? null);
  const [internalEditName, setInternalEditName] = useState<string>(initialEditName ?? '');
  const [internalShowSubtaskFormForId, setInternalShowSubtaskFormForId] = useState<string | null>(initialShowSubtaskFormForId ?? null);
  const [internalNewSubtaskName, setInternalNewSubtaskName] = useState<string>(initialNewSubtaskName ?? '');

  React.useEffect(() => {
    if (initialEditingId !== undefined) setInternalEditingId(initialEditingId);
  }, [initialEditingId]);

  React.useEffect(() => {
    if (initialEditName !== undefined) setInternalEditName(initialEditName);
  }, [initialEditName]);

  React.useEffect(() => {
    if (initialShowSubtaskFormForId !== undefined) setInternalShowSubtaskFormForId(initialShowSubtaskFormForId);
  }, [initialShowSubtaskFormForId]);

  React.useEffect(() => {
    if (initialNewSubtaskName !== undefined) setInternalNewSubtaskName(initialNewSubtaskName);
  }, [initialNewSubtaskName]);

  const editingId = internalEditingId;
  const editName = internalEditName;
  const showSubtaskFormForId = internalShowSubtaskFormForId;
  const newSubtaskName = internalNewSubtaskName;

  const setEditingId: React.Dispatch<React.SetStateAction<string | null>> = (action) => {
    setInternalEditingId((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onSetEditingId?.(next);
      return next;
    });
  };

  const setEditName: React.Dispatch<React.SetStateAction<string>> = (action) => {
    setInternalEditName((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onSetEditName?.(next);
      return next;
    });
  };

  const setShowSubtaskFormForId: React.Dispatch<React.SetStateAction<string | null>> = (action) => {
    setInternalShowSubtaskFormForId((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onSetShowSubtaskFormForId?.(next);
      return next;
    });
  };

  const setNewSubtaskName: React.Dispatch<React.SetStateAction<string>> = (action) => {
    setInternalNewSubtaskName((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onSetNewSubtaskName?.(next);
      return next;
    });
  };

  const startEditing = (taskId: string, currentName: string) => {
    setEditingId(taskId);
    setEditName(currentName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const value = useMemo(
    () => ({
      editingId,
      setEditingId,
      editName,
      setEditName,
      showSubtaskFormForId,
      setShowSubtaskFormForId,
      newSubtaskName,
      setNewSubtaskName,
      startEditing,
      cancelEditing,
    }),
    [editingId, editName, showSubtaskFormForId, newSubtaskName]
  );

  return (
    <TaskEditingContext.Provider value={value}>
      {children}
    </TaskEditingContext.Provider>
  );
}
