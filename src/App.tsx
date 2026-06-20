import React from 'react';
import { OxyContext } from './hooks/useOxyFlow';
import { useOxyAppState } from './hooks/useOxyAppState';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { translate } from './utils/i18n';
import { Sparkles, Terminal, AppWindow, Clock, UploadCloud, Database, Settings, BookOpen, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import GuiRouter from './components/gui/GuiRouter';
import CliInterface from './components/features/cli/CliInterface';
import DbExplorer from './components/features/db-explorer/DbExplorer';
import ManualTab from './components/tabs/ManualTab';
import CreditsTab from './components/tabs/CreditsTab';
import SettingsTab from './components/tabs/SettingsTab';
import BackupTab from './components/tabs/BackupTab';
import TrayWidget from './components/shared/TrayWidget';

// Layout Components
import GuiClosedAlert from './components/layout/GuiClosedAlert';
import SystemNotification from './components/layout/SystemNotification';
import Header from './components/layout/Header';
import DaemonStatusBar from './components/layout/DaemonStatusBar';
import CreditsModal from './components/layout/CreditsModal';

import { GuiCommonProps } from './components/gui/GuiCommonProps';

export default function App() {
  const state = useOxyAppState();

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
    return (
      <OxyContext.Provider value={state}>
        <GuiClosedAlert />
      </OxyContext.Provider>
    );
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
    <OxyContext.Provider value={state}>
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
        {resolvedTheme !== 'high-contrast' && (
          <>
            <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none animate-pulse duration-[8000ms] ${
              resolvedTheme === 'light' ? 'bg-orange-500/5' : 'bg-orange-500/10'
            }`} />
            <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[70%] rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms] ${
              resolvedTheme === 'light' ? 'bg-rose-500/5' : 'bg-rose-500/10'
            }`} />
            <div className={`absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none ${
              resolvedTheme === 'light' ? 'bg-violet-500/5' : 'bg-violet-500/10'
            }`} />
          </>
        )}

        <SystemNotification />

        <AnimatePresence mode="wait">
          {isMinimized ? (
            <TrayWidget
              onRestore={() => {
                setIsMinimized(false);
                showToast(translate(locale, 'app.maximizeRestore', customTranslations));
              }}
              onStopAll={() => {
                handleStopTimer();
                showToast(translate(locale, 'app.stoppedThreads', customTranslations));
              }}
              showToast={showToast}
            />
          ) : guiSize === 'small' ? (
            <GuiRouter 
              variant="small" 
              commonProps={guiCommonProps} 
              isSmallExpanded={isSmallExpanded} 
              setIsSmallExpanded={setIsSmallExpanded} 
              showToast={showToast} 
              handleMinimizeToTray={handleMinimizeToTray} 
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
                  <div className={`border-b transition-all duration-300 ${
                    resolvedTheme === 'light' ? 'bg-[#EAE4DB]/50 border-[#DFD7CB]' : 'bg-black/35 border-white/5'
                  }`}>
                    <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
                      <div className="flex gap-1.5 py-2.5 whitespace-nowrap min-w-max">
                        {[
                          { id: 'main', icon: Clock, iconColor: 'text-orange-400', label: translate(locale, 'tabs.main', customTranslations) },
                          { id: 'reports', icon: BarChart, iconColor: 'text-teal-400', label: translate(locale, 'tabs.reports', customTranslations) },
                          { id: 'db', icon: Database, iconColor: 'text-indigo-400', label: translate(locale, 'tabs.db', customTranslations) },
                          { id: 'options', icon: Settings, iconColor: 'text-yellow-400', label: translate(locale, 'tabs.options', customTranslations) },
                          { id: 'backup', icon: UploadCloud, iconColor: 'text-emerald-400', label: translate(locale, 'tabs.backup', customTranslations) },
                          { id: 'cli', icon: Terminal, iconColor: 'text-[#9B8C83]', label: translate(locale, 'tabs.cli', customTranslations) },
                          { id: 'manual', icon: BookOpen, iconColor: 'text-rose-400', label: translate(locale, 'tabs.manual', customTranslations) },
                          { id: 'credits', icon: Sparkles, iconColor: 'text-sky-400', label: translate(locale, 'tabs.credits', customTranslations) }
                        ].map(tb => {
                          const isActive = activeLargeTab === tb.id;
                          return (
                            <button
                              key={tb.id}
                              onClick={() => setActiveLargeTab(tb.id as any)}
                              data-testid={`tab-${tb.id}`}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer capitalize ${
                                isActive
                                  ? resolvedTheme === 'light'
                                    ? 'bg-[#FCFAF8] text-[#2C2421] border border-[#DFD7CB] shadow font-extrabold'
                                    : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-extrabold'
                                  : resolvedTheme === 'light'
                                  ? 'text-[#8A7A71] hover:text-[#2C2421] hover:bg-[#F4EFEA]'
                                  : 'text-[#9B8C83] hover:text-white hover:bg-[#FCFAF8]/5'
                              }`}
                            >
                              <tb.icon className={`w-4 h-4 ${tb.iconColor} ${isActive ? 'animate-pulse' : ''}`} />
                              <span>{tb.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
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
                        showToast={showToast} 
                        handleMinimizeToTray={handleMinimizeToTray} 
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
                              showToast={showToast} 
                              handleMinimizeToTray={handleMinimizeToTray} 
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
                              showToast={showToast} 
                              handleMinimizeToTray={handleMinimizeToTray} 
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

                <footer className="mt-auto bg-black/50 border-t border-white/10 py-5 px-6 text-center text-[10px] text-[#8A7A71] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <p>OxyFlowOS Environment — SQLite MicroORM</p>
                    <span className="text-white/20 select-none">•</span>
                    <button
                      id="trigger-credits-modal-btn"
                      onClick={() => setShowCreditsModal(true)}
                      className="text-teal-400 hover:text-teal-300 font-bold underline transition-colors cursor-pointer"
                    >
                      {translate(locale, 'dynamic.mITLicenseCreditsOxyFlow', customTranslations)}
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <span>Silnik: <strong className="text-[#9B8C83] font-semibold">Ready</strong></span>
                    <button 
                      id="db-clean-force-btn"
                      onClick={handleResetLocalStorage}
                      className="text-orange-450 hover:text-orange-300 font-bold transition-all cursor-pointer"
                    >
                      Wyczyść Baze (SQL Reset)
                    </button>
                  </div>
                </footer>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CreditsModal />

        {isMinimized && (
          <div className="fixed bottom-6 right-6 z-[100] animate-bounce">
            <button
              id="tray-dot-restore-button"
              onClick={() => {
                setIsMinimized(false);
                showToast("Interfejs LogTime by OxyFlow przywrócony.");
              }}
              className="w-14 h-14 bg-gradient-to-tr from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white shadow-2xl border border-white/20 cursor-pointer transform hover:scale-110 active:scale-95 transition-all"
              title="Przywróć Interfejs LogTime by OxyFlow"
            >
              <AppWindow className="w-6 h-6 text-white" />
            </button>
          </div>
        )}

      </div>
    </OxyContext.Provider>
  );
}
