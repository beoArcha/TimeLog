import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { Clock, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translate } from '@common/i18n/translator';
import { useLiveTaskElapsed } from '@common/hooks/useLiveTaskElapsed';
import { ProjectBadge } from '@/src/features/projects/components/ProjectBadge';
import { TimerDisplay } from '@/src/features/timelogs/components/TimerDisplay';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Heading, Caption, Overline } from '@components/ui/typography';
import { HStack, InlineCluster } from '@components/ui/stack';

export default function ActiveTimerBanner({ state, isCondensed }: { state: GuiState; isCondensed: boolean }) {
  const {
    tasks, activeLog, metrics, locale, customTranslations,
    onStopTimer, projects
  } = state;

  const activeTask = activeLog ? tasks.find(t => t.id === activeLog.taskId) : null;
  const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : null;
  const { formattedElapsed } = useLiveTaskElapsed(activeTask?.id ?? '', {
    metrics,
    activeLog,
  });

  return (
    <AnimatePresence mode="wait">
      {activeLog ? (
        <motion.div
          id="active-timer-banner"
          key="active"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`relative backdrop-blur-md rounded-main padding-section border border-border bg-card text-card-foreground shadow-2xl flex flex-col ${isCondensed ? 'gap-section' : 'sm:flex-row sm:items-center justify-between gap-section'} overflow-hidden transition-all duration-300`}
        >
          <div className="absolute top-0 left-0 w-16 h-16 bg-orange-500 rounded-full filter blur-md animate-pulse pointer-events-none opacity-20"></div>

          <div className="flex items-center gap-section z-10 min-w-0">
            <div className="icon-medium border border-border rounded-section flex items-center justify-center shrink-0 bg-muted/40 relative">
              <Clock className="w-3/5 h-3/5 text-orange-400 animate-spin-slow" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </div>
            <div className="min-w-0">
              <InlineCluster gap="xs">
                <Badge variant="orange" size="xs" as="span" className="whitespace-nowrap uppercase">
                  {translate(locale, 'timer', 'ActiveTracker', customTranslations)}
                </Badge>
                {activeProject && (
                  <ProjectBadge
                    name={activeProject.name}
                    color={activeProject.color}
                    icon={activeProject.icon}
                    size="xs"
                    textClassName="text-foreground"
                  />
                )}
              </InlineCluster>
              <Heading
                level={4}
                className="font-extrabold text-title mt-0.5 leading-snug truncate text-foreground"
                title={activeTask?.name?.length && activeTask.name.length > 512 ? activeTask.name.slice(0, 512) + '...' : activeTask?.name}
              >
                {activeTask?.name}
              </Heading>
            </div>
          </div>

          <div className={`flex items-center gap-section z-10 w-full ${isCondensed ? 'justify-between pt-2 border-t' : 'sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0'} border-border`}>
            <div className="text-right">
              <Overline size="3xs" as="p" className="font-mono font-semibold">
                {translate(locale, 'timer', 'RegisteredToday', customTranslations)}
              </Overline>
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
          <HStack gap="section">
            <div className="icon-medium border border-border rounded-section flex items-center justify-center shrink-0 bg-muted/40">
              <Clock className="w-3/5 h-3/5 text-orange-400" />
            </div>
            <div>
              <Heading level={4} className="font-semibold text-title leading-tight text-foreground">
                {translate(locale, 'timer', 'AllTrackersStopped', customTranslations)}
              </Heading>
              <Caption size="xs" className="mt-0.5">
                {translate(locale, 'timer', 'SelectTaskToPlay', customTranslations)}
              </Caption>
            </div>
          </HStack>
          <div className={isCondensed ? 'w-full pt-2 border-t border-border text-center' : 'text-right'}>
            <Badge variant="outline" size="sm" as="span" className="font-mono font-medium whitespace-nowrap bg-muted/40 text-foreground">
              {translate(locale, 'engine', 'IdleSqlReady', customTranslations)}
            </Badge>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
