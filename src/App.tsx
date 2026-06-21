import React from 'react';
import { useOxyFlow } from '@core/providers/OxyContext';
import { useGlobalShortcuts } from '@core/hooks/useGlobalShortcuts';
import { translate } from '@core/i18n/i18n';
import { motion, AnimatePresence } from 'motion/react';

// Components
import GuiRouter from './gui/GuiRouter';
import CliInterface from '@features/cli/CliInterface';
import DbExplorer from '@features/db-explorer/DbExplorer';
import ManualTab from './gui/tabs/ManualTab';
import CreditsTab from './gui/tabs/CreditsTab';
import SettingsTab from './gui/tabs/SettingsTab';
import BackupTab from './gui/tabs/BackupTab';
import TrayWidget from '@common/components/TrayWidget';

// Layout Components
import GuiClosedAlert from './gui/layout/GuiClosedAlert';
import SystemNotification from './gui/layout/SystemNotification';
import Header from './gui/layout/Header';
import DaemonStatusBar from './gui/layout/DaemonStatusBar';
import CreditsModal from './gui/layout/CreditsModal';
import BackgroundGradients from './gui/layout/BackgroundGradients';
import TabBar from './gui/layout/TabBar';
import AppFooter from './gui/layout/AppFooter';
import RestoreButton from './gui/layout/RestoreButton';

import { GuiCommonProps } from './gui/GuiCommonProps';

export default function App() {
  const state = useOxyFlow();

  const {
    isGuiClosed,
    isMinimized,
    setIsMinimized,
    guiSize,
    resolvedTheme,
    locale,
    customTranslations,
    activeLargeTab,
    setActiveLargeTab,
    isSmallExpanded,
    setIsSmallExpanded,
    currentProjectId,
    lastNonSmallVariant,
    showToast,
    handleMinimizeToTray,
    setGuiSize,
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
    handleRenameProject,
    handleRenameTask,
    handleToggleTaskComplete,
    handleDeleteTask,
    handleStartTimer,
    handleToggleProjectArchive,
    setHolidays,
    nowIso,
    selectedTaskId,
    setSelectedTaskId
  } = state;

  useGlobalShortcuts({
    onToggleTimer: handleToggleTimer,
  });

  if (isGuiClosed) {
    return <GuiClosedAlert />;
  }

  const guiCommonProps: GuiCommonProps = {
    projects,
    tasks,
    logs,
    activeLog,
    holidays,
    patches,
    sysSettings,
    onAddProject: handleAddProject,
    onAddTask: handleAddTask,
    onRenameProject: handleRenameProject,
    onRenameTask: handleRenameTask,
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

  return (
    <div 
      id="app-root-container" 
      className={`min-h-screen flex flex-col font-sans transition-all duration-500 relative overflow-auto p-3 sm:p-6 ${
        resolvedTheme === 'light' 
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
          <TrayWidget
            onRestore={() => {
              setIsMinimized(false);
              showToast?.(translate(locale, 'app.maximizeRestore', customTranslations));
            }}
            onStopAll={() => {
              handleStopTimer();
              showToast?.(translate(locale, 'app.stoppedThreads', customTranslations));
            }}
            showToast={showToast}
          />
        ) : guiSize === 'small' ? (
          <GuiRouter 
            variant="small" 
            commonProps={guiCommonProps} 
            isSmallExpanded={isSmallExpanded} 
            setIsSmallExpanded={setIsSmallExpanded} 
            showToast={showToast!} 
            handleMinimizeToTray={handleMinimizeToTray!} 
            setGuiSize={setGuiSize} 
            currentProjectId={currentProjectId} 
            lastNonSmallVariant={lastNonSmallVariant} 
          />
        ) : (
          <motion.div
            key="windowed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1 flex flex-col w-full"
          >
            <div className={`rounded-[2rem] shadow-3xl overflow-hidden flex flex-col flex-1 border transition-all duration-300 ${
              resolvedTheme === 'light'
                ? 'bg-[#FCFAF7] border-[#DFD7CB]'
                : resolvedTheme === 'high-contrast'
                ? 'bg-black border-2 border-white'
                : 'bg-slate-900/50 backdrop-blur-2xl border-white/10'
            }`}>
              
              <Header />

              {guiSize === 'large' && (
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
                  {guiSize === 'medium' && (
                    <GuiRouter 
                      variant="medium" 
                      commonProps={guiCommonProps} 
                      isSmallExpanded={isSmallExpanded} 
                      setIsSmallExpanded={setIsSmallExpanded} 
                      showToast={showToast!} 
                      handleMinimizeToTray={handleMinimizeToTray!} 
                      setGuiSize={setGuiSize} 
                      currentProjectId={currentProjectId} 
                    />
                  )}

                  {guiSize === 'large' && (
                    <AnimatePresence mode="wait">
                      {activeLargeTab === 'main' && (
                        <motion.div key="large-tab-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <GuiRouter 
                            variant="large" 
                            commonProps={guiCommonProps} 
                            isSmallExpanded={isSmallExpanded} 
                            setIsSmallExpanded={setIsSmallExpanded} 
                            showToast={showToast!} 
                            handleMinimizeToTray={handleMinimizeToTray!} 
                            setGuiSize={setGuiSize} 
                            currentProjectId={currentProjectId} 
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
                          <GuiRouter 
                            variant="large" 
                            commonProps={guiCommonProps} 
                            isSmallExpanded={isSmallExpanded} 
                            setIsSmallExpanded={setIsSmallExpanded} 
                            showToast={showToast!} 
                            handleMinimizeToTray={handleMinimizeToTray!} 
                            setGuiSize={setGuiSize} 
                            currentProjectId={currentProjectId} 
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
