import React, { useMemo } from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { Clock, Square, Play } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { AnimatedCard } from '@components/AnimatedCard';
import { translate } from '@common/i18n/translator';
import { useLiveTaskElapsed } from '@common/hooks/useLiveTaskElapsed';
import { useLastTrackedTask } from '@common/hooks/useLastTrackedTask';
import { ProjectBadge } from '@/src/features/projects/components/ProjectBadge';
import { TimerDisplay } from '@/src/features/timelogs/components/TimerDisplay';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Heading, Caption, Overline } from '@components/ui/typography';
import { HStack, InlineCluster } from '@components/ui/stack';
import { IconBox } from '@components/ui/icon-box';
import { StatusDot } from '@components/ui/status-dot';

export default function ActiveTimerBanner({ state, isCondensed }: { state: GuiState; isCondensed: boolean }) {
  const {
    tasks, activeLog, metrics, locale, customTranslations,
    onStopTimer, onStartTimer, projects, logs
  } = state;

  const { lastTrackedTaskId } = useLastTrackedTask(activeLog);

  const activeTask = activeLog ? tasks.find(t => t.id === activeLog.taskId) : null;
  const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : null;
  const { formattedElapsed } = useLiveTaskElapsed(activeTask?.id ?? '', {
    metrics,
    activeLog,
  });

  const lastTask = useMemo(() => {
    if (lastTrackedTaskId) {
      const found = tasks.find(t => t.id === lastTrackedTaskId);
      if (found) return found;
    }
    const sortedLogs = (logs || [])
      .filter(l => Boolean(l.endTime))
      .sort((a, b) => new Date(b.endTime ?? b.startTime).getTime() - new Date(a.endTime ?? a.startTime).getTime());
    if (sortedLogs[0]) {
      return tasks.find(t => t.id === sortedLogs[0].taskId) ?? null;
    }
    return null;
  }, [lastTrackedTaskId, tasks, logs]);

  const lastProject = lastTask ? projects.find(p => p.id === lastTask.projectId) : null;
  const { formattedElapsed: lastTaskElapsed } = useLiveTaskElapsed(lastTask?.id ?? '', {
    metrics,
  });

  return (
    <AnimatePresence mode="wait">
      {activeLog ? (
        <AnimatedCard
          id="active-timer-banner"
          key="active"
          hoverable={false}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`relative backdrop-blur-md rounded-main padding-section shadow-2xl flex flex-col ${isCondensed ? 'gap-section' : 'sm:flex-row sm:items-center justify-between gap-section'} overflow-hidden transition-all duration-300 h-auto`}
        >
          <div className="absolute top-0 left-0 w-16 h-16 bg-orange-500 rounded-full filter blur-md animate-pulse pointer-events-none opacity-20"></div>

          <HStack gap="section" align="center" className="z-10 min-w-0">
            <IconBox size="md" variant="muted" rounded="section" className="relative shrink-0">
              <Clock className="w-3/5 h-3/5 text-orange-400 animate-spin-slow" />
              <StatusDot variant="rose" size="xs" ping className="absolute -top-1 -right-1" />
            </IconBox>
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
          </HStack>

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
        </AnimatedCard>
      ) : (
        <div
          id="active-timer-idle-banner"
          key="idle"
          className={`backdrop-blur-md rounded-main padding-section border border-border bg-card/60 text-card-foreground shadow-xs flex flex-col ${
            isCondensed ? 'gap-section' : 'sm:flex-row items-center justify-between gap-section'
          } transition-all duration-300`}
        >
          <HStack gap="section" className="min-w-0 flex-1">
            <IconBox size="md" variant="muted" rounded="section" className="shrink-0">
              <Clock className="w-3/5 h-3/5 text-orange-400" />
            </IconBox>
            {lastTask ? (
              <div className="min-w-0 flex-1">
                <InlineCluster gap="xs">
                  <Badge variant="outline" size="xs" as="span" className="whitespace-nowrap uppercase">
                    {translate(locale, 'timer', 'LastTrackedTask', customTranslations)}
                  </Badge>
                  {lastProject && (
                    <ProjectBadge
                      name={lastProject.name}
                      color={lastProject.color}
                      icon={lastProject.icon}
                      size="xs"
                      textClassName="text-foreground"
                    />
                  )}
                </InlineCluster>
                <Heading
                  level={4}
                  className="font-semibold text-title mt-0.5 leading-snug truncate text-foreground"
                  title={lastTask.name}
                >
                  {lastTask.name}
                </Heading>
              </div>
            ) : (
              <div>
                <Heading level={4} className="font-semibold text-title leading-tight text-foreground">
                  {translate(locale, 'timer', 'AllTrackersStopped', customTranslations)}
                </Heading>
                <Caption size="xs" className="mt-0.5">
                  {translate(locale, 'timer', 'SelectTaskToPlay', customTranslations)}
                </Caption>
              </div>
            )}
          </HStack>

          <div
            className={`flex items-center gap-section z-10 ${
              isCondensed
                ? 'w-full justify-between pt-2 border-t'
                : 'sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0'
            } border-border shrink-0`}
          >
            {lastTask && (
              <div className="text-right">
                <Overline size="3xs" as="p" className="font-mono font-semibold">
                  {translate(locale, 'timer', 'RegisteredToday', customTranslations)}
                </Overline>
                <TimerDisplay
                  value={lastTaskElapsed}
                  isRunning={false}
                  size="lg"
                />
              </div>
            )}
            {lastTask ? (
              <Button
                id="resume-timer-btn"
                variant="accent"
                size="sm"
                onClick={() => onStartTimer(lastTask.id)}
                className="gap-1.5 rounded-xl px-3 py-1.5 shadow-md active:scale-95 cursor-pointer shrink-0 font-semibold"
                title={translate(locale, 'timer', 'ResumeTimer', customTranslations)}
                aria-label={translate(locale, 'timer', 'ResumeTimer', customTranslations)}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{translate(locale, 'timer', 'ResumeTimer', customTranslations)}</span>
              </Button>
            ) : (
              <Badge
                variant="outline"
                size="sm"
                as="span"
                className="font-mono font-medium whitespace-nowrap bg-muted/40 text-foreground"
              >
                {translate(locale, 'engine', 'IdleSqlReady', customTranslations)}
              </Badge>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
