import { useMemo } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { GuiSize } from '@bindings/GuiSize';
import { TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';

interface UseSmallGuiParams {
  projects: Project[];
  tasks: Task[];
  locale: Locale;
  customTranslations: Partial<TranslationDictionary> | undefined;
  currentProjectId: string;
  showToast: (msg: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  setGuiSize: (variant: GuiSize) => void;
  lastNonSmallVariant: Exclude<GuiSize, 'small'> | undefined;
}

export interface SmallGuiDerived {
  activeProj: Project | undefined;
  projectRootTasks: Task[];
  handleStartTimer: (taskId: string) => void;
  handleStopTimer: () => void;
  handleRestoreWindow: () => void;
}

export function useSmallGui({
  projects,
  tasks,
  locale,
  currentProjectId,
  showToast,
  onStartTimer,
  onStopTimer,
  setGuiSize,
  lastNonSmallVariant,
}: UseSmallGuiParams): SmallGuiDerived {
  const activeProj = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? projects[0],
    [projects, currentProjectId],
  );

  const projectRootTasks = useMemo(() => {
    if (!activeProj) return [];
    return tasks.filter((t) => t.projectId === activeProj.id && !t.parentTaskId);
  }, [tasks, activeProj]);

  const handleStartTimer = (taskId: string) => {
    onStartTimer(taskId);
  };

  const handleStopTimer = () => {
    onStopTimer();
  };

  const handleRestoreWindow = () => {
    const target = lastNonSmallVariant ?? 'large';
    setGuiSize(target);
    const sizeLabel =
      target === 'medium'
        ? locale === 'pl'
          ? 'ŚREDNI'
          : 'MEDIUM'
        : locale === 'pl'
          ? 'DUŻY'
          : 'LARGE';
    showToast(
      locale === 'pl'
        ? `Rozmiar zmieniony na ${sizeLabel}`
        : `Size changed to ${sizeLabel}`,
    );
  };

  return {
    activeProj,
    projectRootTasks,
    handleStartTimer,
    handleStopTimer,
    handleRestoreWindow,
  };
}
