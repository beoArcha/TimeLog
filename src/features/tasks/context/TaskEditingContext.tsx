/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

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

  const [prevInitialEditingId, setPrevInitialEditingId] = useState(initialEditingId);
  if (initialEditingId !== undefined && initialEditingId !== prevInitialEditingId) {
    setPrevInitialEditingId(initialEditingId);
    setInternalEditingId(initialEditingId);
  }

  const [prevInitialEditName, setPrevInitialEditName] = useState(initialEditName);
  if (initialEditName !== undefined && initialEditName !== prevInitialEditName) {
    setPrevInitialEditName(initialEditName);
    setInternalEditName(initialEditName);
  }

  const [prevInitialShowSubtaskFormForId, setPrevInitialShowSubtaskFormForId] = useState(initialShowSubtaskFormForId);
  if (initialShowSubtaskFormForId !== undefined && initialShowSubtaskFormForId !== prevInitialShowSubtaskFormForId) {
    setPrevInitialShowSubtaskFormForId(initialShowSubtaskFormForId);
    setInternalShowSubtaskFormForId(initialShowSubtaskFormForId);
  }

  const [prevInitialNewSubtaskName, setPrevInitialNewSubtaskName] = useState(initialNewSubtaskName);
  if (initialNewSubtaskName !== undefined && initialNewSubtaskName !== prevInitialNewSubtaskName) {
    setPrevInitialNewSubtaskName(initialNewSubtaskName);
    setInternalNewSubtaskName(initialNewSubtaskName);
  }

  const editingId = internalEditingId;
  const editName = internalEditName;
  const showSubtaskFormForId = internalShowSubtaskFormForId;
  const newSubtaskName = internalNewSubtaskName;

  const setEditingId: React.Dispatch<React.SetStateAction<string | null>> = useCallback((action) => {
    setInternalEditingId((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onSetEditingId?.(next);
      return next;
    });
  }, [onSetEditingId]);

  const setEditName: React.Dispatch<React.SetStateAction<string>> = useCallback((action) => {
    setInternalEditName((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onSetEditName?.(next);
      return next;
    });
  }, [onSetEditName]);

  const setShowSubtaskFormForId: React.Dispatch<React.SetStateAction<string | null>> = useCallback((action) => {
    setInternalShowSubtaskFormForId((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onSetShowSubtaskFormForId?.(next);
      return next;
    });
  }, [onSetShowSubtaskFormForId]);

  const setNewSubtaskName: React.Dispatch<React.SetStateAction<string>> = useCallback((action) => {
    setInternalNewSubtaskName((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onSetNewSubtaskName?.(next);
      return next;
    });
  }, [onSetNewSubtaskName]);

  const startEditing = useCallback((taskId: string, currentName: string) => {
    setEditingId(taskId);
    setEditName(currentName);
  }, [setEditingId, setEditName]);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, [setEditingId, setEditName]);

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
    [
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
    ]
  );

  return (
    <TaskEditingContext.Provider value={value}>
      {children}
    </TaskEditingContext.Provider>
  );
}
