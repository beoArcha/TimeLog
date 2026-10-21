import { useMemo } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { LayoutVariant } from '@bindings/LayoutVariant';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';

interface UseCompactLayoutParams {
  projects: Project[];
  tasks: Task[];
  locale: Locale;
  customTranslations: Partial<TranslationDictionary> | undefined;
  currentProjectId: string;
  showToast: (msg: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: () => void;
  setLayoutVariant: (variant: LayoutVariant) => void;
  lastNonCompactVariant: Exclude<LayoutVariant, 'compact'> | undefined;
}

export interface CompactLayoutDerived {
  activeProj: Project | undefined;
  projectRootTasks: Task[];
  handleStartTimer: (taskId: string) => void;
  handleStopTimer: () => void;
  handleRestoreWindow: () => void;
}

export function useCompactLayout({
  projects,
  tasks,
  locale,
  customTranslations,
  currentProjectId,
  showToast,
  onStartTimer,
  onStopTimer,
  setLayoutVariant,
  lastNonCompactVariant,
}: UseCompactLayoutParams): CompactLayoutDerived {
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
    const target = lastNonCompactVariant ?? 'full';
    setLayoutVariant(target);
    const sizeKey = target === 'medium' ? 'SizeMedium' : 'SizeLarge';
    const sizeLabel = translate(locale, 'app', sizeKey, customTranslations);
    const prefix = translate(locale, 'app', 'SizeChanged', customTranslations);
    showToast(`${prefix} ${sizeLabel}`);
  };

  return {
    activeProj,
    projectRootTasks,
    handleStartTimer,
    handleStopTimer,
    handleRestoreWindow,
  };
}
