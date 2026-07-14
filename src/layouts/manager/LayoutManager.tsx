import React from 'react';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { useGlobalShortcuts } from '@common/hooks/useGlobalShortcuts';
import { translate } from '@common/i18n/translator';
import { motion, AnimatePresence } from 'motion/react';
import { isDesktopEnvironment } from '@common/utils/environment';
import AppProviders from './AppProviders';

// Components
import CliInterface from '@features/cli/CliInterface';
import DbExplorer from '@features/db-explorer/DbExplorer';
import ManualTab from '@features/settings/ManualTab';
import CreditsTab from '@features/settings/CreditsTab';
import SettingsTab from '@features/settings/SettingsTab';
import BackupTab from '@features/settings/BackupTab';
import TrayWidgetView from '@features/tray/TrayWidgetView';

// Layout Components
import GuiClosedAlert from '../components/GuiClosedAlert';
import SystemNotification from '@components/SystemNotification';
import Header from '../components/Header';
import DaemonStatusBar from '../components/DaemonStatusBar';
import CreditsModal from '../components/CreditsModal';
import BackgroundGradients from '@components/BackgroundGradients';
import TabBar from '../components/TabBar';
import AppFooter from '../components/AppFooter';
import RestoreButton from '@components/RestoreButton';

// Builders
import CompactLayoutBuilder from '../builders/CompactLayoutBuilder';
import MediumLayoutBuilder from '../builders/MediumLayoutBuilder';
import FullLayoutBuilder from '../builders/FullLayoutBuilder';

// Types & Logics
import { LayoutCommonProps } from '../types/LayoutCommonProps';
import { useGuiLogic } from '../hooks/useGuiLogic';

interface LayoutManagerContentProps {
  runtime: 'tauri' | 'browser';
}

function LayoutManagerContent({ runtime }: LayoutManagerContentProps) {
  const state = useOxyFlow();

  const {
    isGuiClosed,
    isMinimized,
    setIsMinimized,
    layoutVariant,
    resolvedTheme,
    locale,
    customTranslations,
    activeLargeTab,
    setActiveLargeTab,
    isCompactExpanded,
    setIsCompactExpanded,
    currentProjectId,
    lastNonCompactVariant,
    alwaysOnTopSmall,
    setAlwaysOnTopSmall,
    showToast,
    handleMinimizeToTray,
    setLayoutVariant,
    handleToggleTimer,
    handleStopTimer,
    handleResetLocalStorage,
    setShowCreditsModal,
    projects,
    tasks,
    logs,
    activeLog,
    holidays,
    patches,
    sysSettings,
    handleAddProject,
    handleAddTask,
    handleUpdateProject,
    handleUpdateTask,
    handleToggleTaskComplete,
    handleDeleteTask,
    handleStartTimer,
    handleToggleProjectArchive,
    setHolidays,
    nowIso,
    selectedTaskId,
    setSelectedTaskId
  } = state;

  const LARGE_TAB_IDS = ['main', 'reports', 'db', 'options', 'backup', 'cli', 'manual', 'credits'] as const;

  useGlobalShortcuts({
    onToggleTimer: handleToggleTimer,
    onSwitchTab: (index) => {
      if (layoutVariant === 'full' && index < LARGE_TAB_IDS.length) {
        setActiveLargeTab(LARGE_TAB_IDS[index]);
      }
    },
    onEscape: () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
  });

  const guiCommonProps: LayoutCommonProps = {
    projects,
    tasks,
    logs,
    activeLog,
    holidays,
    patches,
    sysSettings,
    onAddProject: handleAddProject,
    onAddTask: handleAddTask,
    onRenameProject: (projectId: string, name: string) => {
      const p = projects.find(proj => proj.id === projectId);
      if (p) {
        handleUpdateProject(projectId, name, p.color, p.description ?? null, p.icon ?? null, p.tags ?? null);
      }
    },
    onRenameTask: (taskId: string, name: string) => {
      const t = tasks.find(tsk => tsk.id === taskId);
      if (t) {
        handleUpdateTask(taskId, name, t.parentTaskId ?? null, t.status ?? null, t.completed);
      }
    },
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
    textAndIconSize: state.textAndIconSize,
    selectedTaskId,
    setSelectedTaskId,
    activeLargeTab,
    activeView: activeLargeTab === 'reports' ? 'reports' : 'tasks',
  };

  const guiState = useGuiLogic(guiCommonProps);

  if (isGuiClosed) {
    return <GuiClosedAlert />;
  }

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
  };

  return (
    <div
      id="app-root-container"
      data-runtime={runtime}
      data-layout-variant={layoutVariant}
      data-text-size={state.textAndIconSize || 'medium'}
      className={`min-h-screen flex flex-col font-sans transition-all duration-500 relative overflow-auto p-3 sm:p-6 ${resolvedTheme === 'light'
        ? 'bg-[#F4EFEA] text-[#2C2421] selection:bg-orange-500/20 selection:text-orange-950'
        : resolvedTheme === 'high-contrast'
          ? 'bg-black text-white selection:bg-yellow-500/30 selection:text-white'
          : 'bg-[#0b0f19] text-slate-200 selection:bg-orange-500/30 selection:text-white'
        }`}
    >
      <BackgroundGradients theme={resolvedTheme} />

      <SystemNotification />

      <AnimatePresence mode="wait">
        {isMinimized ? (
          <TrayWidgetView
            onRestore={() => {
              setIsMinimized(false);
              showToast?.(translate(locale, 'app', 'MaximizeRestore', customTranslations));
            }}
            onStopAll={() => {
              handleStopTimer();
              showToast?.(translate(locale, 'app', 'StoppedThreads', customTranslations));
            }}
            showToast={showToast}
          />
        ) : layoutVariant === 'compact' ? (
          <CompactLayoutBuilder
            state={guiState}
            {...sharedProps}
          />
        ) : (
          <motion.div
            key="windowed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col w-full"
          >
            <div className={`rounded-[2rem] shadow-3xl overflow-hidden flex flex-col flex-1 border transition-all duration-300 ${resolvedTheme === 'light'
              ? 'bg-[#FCFAF7] border-[#DFD7CB]'
              : resolvedTheme === 'high-contrast'
                ? 'bg-black border-2 border-white'
                : 'bg-slate-900/50 backdrop-blur-2xl border-white/10'
              }`}>

              <Header />

              {layoutVariant === 'full' && (
                <TabBar
                  locale={locale}
                  customTranslations={customTranslations}
                  resolvedTheme={resolvedTheme}
                  activeLargeTab={activeLargeTab}
                  setActiveLargeTab={setActiveLargeTab}
                />
              )}

              <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 z-10 flex flex-col gap-6">

                <DaemonStatusBar />

                <div id="tab-viewport" className="min-h-[480px]">
                  {layoutVariant === 'medium' && (
                    <MediumLayoutBuilder
                      state={guiState}
                      {...sharedProps}
                    />
                  )}

                  {layoutVariant === 'full' && (
                    <AnimatePresence mode="wait">
                      {activeLargeTab === 'main' && (
                        <motion.div key="large-tab-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <FullLayoutBuilder
                            state={guiState}
                            {...sharedProps}
                          />
                        </motion.div>
                      )}

                      {activeLargeTab === 'cli' && (
                        <motion.div key="large-tab-cli" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <CliInterface
                            projects={projects}
                            tasks={tasks}
                            logs={logs}
                            activeLog={activeLog}
                            onAddProject={handleAddProject}
                            onAddTask={handleAddTask}
                            onToggleTaskComplete={handleToggleTaskComplete}
                            onStartTimer={handleStartTimer}
                            onStopTimer={handleStopTimer}
                            onToggleProjectArchive={handleToggleProjectArchive}
                            nowIso={nowIso}
                            locale={locale}
                            customTranslations={customTranslations}
                            theme={resolvedTheme}
                            holidays={holidays}
                            setHolidays={setHolidays}
                            patches={patches}
                            sysSettings={sysSettings}
                            selectedTaskId={selectedTaskId}
                            setSelectedTaskId={setSelectedTaskId}
                          />
                        </motion.div>
                      )}

                      {activeLargeTab === 'reports' && (
                        <motion.div key="large-tab-reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <FullLayoutBuilder
                            state={guiState}
                            {...sharedProps}
                          />
                        </motion.div>
                      )}

                      {activeLargeTab === 'db' && (
                        <motion.div key="large-tab-db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <DbExplorer />
                        </motion.div>
                      )}

                      {activeLargeTab === 'backup' && (
                        <motion.div key="large-tab-backup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <BackupTab />
                        </motion.div>
                      )}

                      {activeLargeTab === 'options' && (
                        <motion.div key="large-tab-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <SettingsTab />
                        </motion.div>
                      )}

                      {activeLargeTab === 'manual' && (
                        <motion.div key="large-tab-manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <ManualTab />
                        </motion.div>
                      )}

                      {activeLargeTab === 'credits' && (
                        <motion.div key="large-tab-credits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <CreditsTab />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </main>

              <AppFooter
                locale={locale}
                customTranslations={customTranslations}
                handleResetLocalStorage={handleResetLocalStorage!}
                setShowCreditsModal={setShowCreditsModal!}
              />

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreditsModal />

      {isMinimized && (
        <RestoreButton setIsMinimized={setIsMinimized} showToast={showToast!} />
      )}

    </div>
  );
}

export default function LayoutManager({ runtime }: { runtime?: 'tauri' | 'browser' } = {}) {
  const resolvedRuntime = runtime || (isDesktopEnvironment() ? 'tauri' : 'browser');
  return (
    <AppProviders>
      <LayoutManagerContent runtime={resolvedRuntime} />
    </AppProviders>
  );
}
