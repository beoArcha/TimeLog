import { motion, AnimatePresence } from 'motion/react';
import type { GuiRouterProps } from '../types/LayoutCommonProps';
import { GuiState } from '../hooks/useGuiLogic';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { useCompactLayout } from './hooks/useCompactLayout';
import { CompactLayoutHeader } from './CompactLayoutHeader';
import { ActiveProjectCard } from './ActiveProjectCard';
import { TaskVisibilityToggle } from './TaskVisibilityToggle';
import { TaskList } from './TaskList';

type SmallGuiProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function SmallGui({ state, ...rest }: SmallGuiProps) {
  const {
    isSmallExpanded,
    setIsSmallExpanded,
    showToast,
    handleMinimizeToTray,
    setLayoutVariant,
    currentProjectId,
    lastNonCompactVariant,
  } = rest;

  const {
    projects,
    tasks,
    activeLog,
    theme,
    locale,
    customTranslations,
  } = state;

  const resolvedTheme = theme;

  const { alwaysOnTopSmall, setAlwaysOnTopSmall } = useOxyFlow();

  const { activeProj, projectRootTasks, handleStartTimer, handleStopTimer, handleRestoreWindow } =
    useCompactLayout({
      projects,
      tasks,
      locale,
      customTranslations,
      currentProjectId,
      showToast,
      onStartTimer: state.onStartTimer,
      onStopTimer: state.onStopTimer,
      setLayoutVariant,
      lastNonCompactVariant,
    });

  return (
    <motion.div
      key="small-state"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="w-full h-full flex flex-col p-1"
    >
      <div
        className={`rounded-2xl border shadow-2xl p-3 flex flex-col gap-2.5 relative overflow-hidden transition-all duration-300 w-full h-full ${resolvedTheme === 'light'
          ? 'bg-white border-slate-200 text-slate-800'
          : resolvedTheme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-slate-950/95 backdrop-blur-xl border-white/10 text-white'
          }`}
      >
        {resolvedTheme !== 'high-contrast' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-rose-500 to-indigo-500" />
        )}

        <CompactLayoutHeader
          locale={locale}
          customTranslations={customTranslations}
          alwaysOnTopSmall={alwaysOnTopSmall}
          lastNonCompactVariant={lastNonCompactVariant}
          setAlwaysOnTopSmall={setAlwaysOnTopSmall}
          showToast={showToast}
          onRestoreWindow={handleRestoreWindow}
          onMinimizeToTray={handleMinimizeToTray}
        />

        {activeProj && (
          <ActiveProjectCard
            activeProj={activeProj}
            resolvedTheme={resolvedTheme}
            locale={locale}
            customTranslations={customTranslations}
          />
        )}

        <TaskVisibilityToggle
          isExpanded={isSmallExpanded}
          resolvedTheme={resolvedTheme}
          locale={locale}
          customTranslations={customTranslations}
          onToggle={() => setIsSmallExpanded(!isSmallExpanded)}
        />

        <AnimatePresence>
          {isSmallExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 text-left"
            >
              <TaskList
                activeProj={activeProj}
                rootTasks={projectRootTasks}
                allTasks={tasks}
                activeLog={activeLog}
                resolvedTheme={resolvedTheme}
                locale={locale}
                customTranslations={customTranslations}
                onStartTimer={handleStartTimer}
                onStopTimer={handleStopTimer}
                showToast={showToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
