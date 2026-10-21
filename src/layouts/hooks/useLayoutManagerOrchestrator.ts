import { useState, useCallback } from 'react';
import { useSettings } from '@common/hooks/SettingsContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { useCliSession } from '@features/cli/context/CliSessionContext';
import { useGlobalShortcuts } from '@common/hooks/useGlobalShortcuts';
import { translate } from '@common/i18n/translator';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { isFullLayout } from '@common/constants/layoutVariants';
import { LayoutCommonProps } from '../types/LayoutCommonProps';
import { useGuiLogic } from './useGuiLogic';

const LARGE_TAB_IDS = ['main', 'reports', 'db', 'options', 'backup', 'cli', 'manual', 'credits'] as const;

export const useLayoutManagerOrchestrator = () => {
  const {
    isGuiClosed,
    isMinimized,
    setIsMinimized,
    showToast,
    handleMinimizeToTray,
    handleToggleTimer,
    nowIso,
  } = useWindowShell();

  const {
    layoutVariant,
    resolvedTheme,
    textAndIconSize,
    activeLargeTab,
    setActiveLargeTab,
    isCompactExpanded,
    setIsCompactExpanded,
    currentProjectId,
    lastNonCompactVariant,
    alwaysOnTopSmall,
    setAlwaysOnTopSmall,
    setLayoutVariant,
    setShowCreditsModal,
    sysSettings,
  } = useSettings();

  const {
    locale,
    customTranslations,
  } = useLocale();

  const {
    handleStopTimer,
    projects,
    tasks,
    logs,
    activeLog,
    computedMetrics,
    holidays,
    patches,
    handleAddProject,
    handleAddTask,
    handleUpdateProject,
    handleUpdateTask,
    handleToggleTaskComplete,
    handleDeleteTask,
    handleStartTimer,
    handleToggleProjectArchive,
    setHolidays,
    selectedTaskId,
    setSelectedTaskId,
    handleResetLocalStorage,
  } = useData();

  const {
    toggleDrawer,
    isDrawerOpen,
    setDrawerOpen,
  } = useCliSession();

  const [mediumDockPosition, setMediumDockPosition] = useState<'right' | 'left'>(() => {
    try {
      return (localStorage.getItem('oxy_medium_dock_pos') as 'right' | 'left') || 'right';
    } catch (err) {
      ErrorHandler.handle(new PersistenceException('Failed to read medium dock position from localStorage', err, 'WARN_STORAGE_READ', 'WARN'));
      return 'right';
    }
  });

  const handleToggleMediumDock = useCallback(() => {
    setMediumDockPosition(prev => {
      const next = prev === 'right' ? 'left' : 'right';
      try {
        localStorage.setItem('oxy_medium_dock_pos', next);
      } catch (err) {
        ErrorHandler.handle(new PersistenceException('Failed to save medium dock position to localStorage', err, 'WARN_STORAGE_WRITE', 'WARN'));
      }
      return next;
    });
  }, []);

  useGlobalShortcuts({
    onToggleTimer: handleToggleTimer,
    onSwitchTab: (index) => {
      if (isFullLayout(layoutVariant) && index < LARGE_TAB_IDS.length) {
        setActiveLargeTab(LARGE_TAB_IDS[index]);
      }
    },
    onEscape: () => {
      if (isDrawerOpen) {
        setDrawerOpen(false);
        return;
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    onToggleCliDrawer: toggleDrawer,
  });

  const onRenameProject = useCallback((projectId: string, name: string) => {
    const p = projects.find(proj => proj.id === projectId);
    if (p) {
      handleUpdateProject(projectId, name, p.color, p.description ?? null, p.icon ?? null, p.tags ?? null);
    }
  }, [handleUpdateProject, projects]);

  const onRenameTask = useCallback((taskId: string, name: string) => {
    const t = tasks.find(tsk => tsk.id === taskId);
    if (t) {
      handleUpdateTask(taskId, name, t.parentTaskId ?? null, t.status ?? null, t.completed);
    }
  }, [handleUpdateTask, tasks]);

  const guiCommonProps: LayoutCommonProps = {
    projects,
    tasks,
    logs,
    activeLog,
    metrics: computedMetrics,
    holidays,
    patches,
    sysSettings,
    onAddProject: handleAddProject,
    onAddTask: handleAddTask,
    onRenameProject,
    onRenameTask,
    onUpdateProject: handleUpdateProject,
    onUpdateTask: handleUpdateTask,
    onToggleTaskComplete: handleToggleTaskComplete,
    onDeleteTask: handleDeleteTask,
    onStartTimer: handleStartTimer,
    onStopTimer: handleStopTimer,
    onToggleProjectArchive: handleToggleProjectArchive,
    setHolidays,
    nowIso,
    locale,
    customTranslations,
    theme: resolvedTheme,
    textAndIconSize,
    selectedTaskId,
    setSelectedTaskId,
    activeLargeTab,
    activeView: activeLargeTab === 'reports' ? 'reports' : 'tasks',
  };

  const guiState = useGuiLogic(guiCommonProps);

  const sharedProps = {
    isCompactExpanded,
    setIsCompactExpanded,
    showToast: showToast!,
    handleMinimizeToTray: handleMinimizeToTray!,
    setLayoutVariant,
    currentProjectId,
    lastNonCompactVariant,
    alwaysOnTopSmall,
    setAlwaysOnTopSmall,
    dockPosition: mediumDockPosition,
    onToggleDock: handleToggleMediumDock,
  };

  const handleRestoreFromTray = useCallback(() => {
    setIsMinimized(false);
    showToast?.(translate(locale, 'app', 'MaximizeRestore', customTranslations));
  }, [locale, customTranslations, setIsMinimized, showToast]);

  const handleStopAllThreads = useCallback(() => {
    handleStopTimer();
    showToast?.(translate(locale, 'app', 'StoppedThreads', customTranslations));
  }, [handleStopTimer, locale, customTranslations, showToast]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  return {
    isGuiClosed,
    isMinimized,
    setIsMinimized,
    layoutVariant,
    textAndIconSize,
    guiState,
    sharedProps,
    mediumDockPosition,
    activeLargeTab,
    setActiveLargeTab,
    locale,
    customTranslations,
    showToast,
    handleResetLocalStorage,
    setShowCreditsModal,
    handleRestoreFromTray,
    handleStopAllThreads,
    closeDrawer,
  };
};
