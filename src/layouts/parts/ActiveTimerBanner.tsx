import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { Clock, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translate } from '@common/i18n/translator';
import { useLiveTaskElapsed } from '@common/hooks/useLiveTaskElapsed';
import { ProjectBadge } from '@/src/features/projects/components/ProjectBadge';
import { TimerDisplay } from '@/src/features/timelogs/components/TimerDisplay';
import { Button } from '@components/ui/button';

export default function ActiveTimerBanner({ state, isCondensed }: { state: GuiState; isCondensed: boolean }) {
  const {
    tasks, logs, nowIso, activeLog, metrics, locale, customTranslations,
    onStopTimer, projects
  } = state;

  const activeTask = activeLog ? tasks.find(t => t.id === activeLog.taskId) : null;
  const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : null;
  const { formattedElapsed } = useLiveTaskElapsed(activeTask?.id ?? '', {
    metrics,
    activeLog,
    tasks,
    logs,
    nowIso,
  });

  return (
    <AnimatePresence mode="wait">
      {activeLog ? (
        <motion.div
          id="active-timer-banner"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className={`padding-section rounded-main border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-orange-500/10 shadow-xl flex flex-col ${isCondensed ? 'items-start' : 'sm:flex-row items-center justify-between'} gap-section relative overflow-hidden backdrop-blur-md transition-all`}
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <div className="absolute top-0 left-0 w-16 h-16 bg-orange-500 rounded-full filter blur-md animate-pulse"></div>
          </div>

          <div className={`flex items-center gap-section z-10 ${isCondensed ? 'w-full' : 'sm:w-auto w-full'}`}>
            <div className="relative">
              <div className="icon-medium shrink-0 rounded-xl flex items-center justify-center border border-border bg-card shadow-md text-orange-500">
                <Clock className="w-3/5 h-3/5 animate-pulse text-orange-500" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] bg-orange-500/20 border border-orange-500/30 text-orange-500 font-bold px-1.5 py-0.2 rounded-full font-mono uppercase whitespace-nowrap">
                  {translate(locale, 'timer', 'ActiveTracker', customTranslations)}
                </span>
                {activeProject && (
                  <ProjectBadge
                    name={activeProject.name}
                    color={activeProject.color}
                    icon={activeProject.icon}
                    size="xs"
                    textClassName="text-foreground"
                  />
                )}
              </div>
              <h4 className="font-sans font-extrabold text-title mt-0.5 leading-snug truncate text-foreground" title={activeTask?.name?.length && activeTask.name.length > 512 ? activeTask.name.slice(0, 512) + '...' : activeTask?.name}>
                {activeTask?.name}
              </h4>
            </div>
          </div>

          <div className={`flex items-center gap-section z-10 w-full ${isCondensed ? 'justify-between pt-2 border-t' : 'sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0'} border-border`}>
            <div className="text-right">
              <p className="text-[9px] font-semibold tracking-wider font-mono uppercase text-muted-foreground">
                {translate(locale, 'timer', 'RegisteredToday', customTranslations)}
              </p>
              <TimerDisplay
                id="active-timer-display"
                value={formattedElapsed}
                isRunning={true}
                size="xl"
              />
            </div>
            <Button
              id="stop-timer-btn"
              variant="destructive"
              size="icon"
              onClick={() => onStopTimer()}
              className="rounded-xl h-10 w-10 sm:h-11 sm:w-11 min-h-[40px] min-w-[40px] shadow-md transform active:scale-95 group cursor-pointer shrink-0"
              title={translate(locale, 'timer', 'StopTimer', customTranslations)}
              aria-label={translate(locale, 'timer', 'StopTimer', customTranslations)}
            >
              <Square className="w-4 h-4 text-white fill-white group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <div id="active-timer-idle-banner" className={`backdrop-blur-md rounded-main padding-section border border-border bg-card/60 text-card-foreground shadow-xs flex flex-col ${isCondensed ? 'gap-section' : 'md:flex-row items-center justify-between gap-section'} transition-all duration-300`}>
          <div className="flex items-center gap-section">
            <div className="icon-medium border border-border rounded-section flex items-center justify-center shrink-0 bg-muted/40">
              <Clock className="w-3/5 h-3/5 text-orange-400" />
            </div>
            <div>
              <h4 className="font-semibold text-title leading-tight text-foreground">
                {translate(locale, 'timer', 'AllTrackersStopped', customTranslations)}
              </h4>
              <p className="text-xs mt-0.5 text-muted-foreground">
                {translate(locale, 'timer', 'SelectTaskToPlay', customTranslations)}
              </p>
            </div>
          </div>
          <div className={isCondensed ? 'w-full pt-2 border-t border-border text-center' : 'text-right'}>
            <span className="text-xs border border-border px-2.5 py-1 rounded-full font-mono font-medium whitespace-nowrap inline-block bg-muted/40 text-foreground">
              {translate(locale, 'engine', 'IdleSqlReady', customTranslations)}
            </span>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
