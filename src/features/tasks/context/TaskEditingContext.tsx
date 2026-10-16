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

export function TaskEditingProvider({ children }: { children: React.ReactNode }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [showSubtaskFormForId, setShowSubtaskFormForId] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState<string>('');

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
