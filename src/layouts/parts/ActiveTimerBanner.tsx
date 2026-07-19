import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import { Clock, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translate } from '@common/i18n/translator';
import { getTaskDurationSeconds, formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';

export default function ActiveTimerBanner({ state, isCondensed }: { state: GuiState; isCondensed: boolean }) {
  const {
    tasks, logs, activeLog, nowIso, locale, customTranslations, theme,
    onStopTimer, projects
  } = state;

  const activeTask = activeLog ? tasks.find(t => t.id === activeLog.taskId) : null;
  const activeProject = activeTask ? projects.find(p => p.id === activeTask.projectId) : null;

  return (
    <AnimatePresence mode="wait">
      {activeLog ? (
        <motion.div
          id="active-timer-banner"
          initial={{ height: 0, opacity: 0, scale: 0.95 }}
          animate={{ height: 'auto', opacity: 1, scale: 1 }}
          exit={{ height: 0, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className={`padding-section rounded-main border shadow-xl flex flex-col ${isCondensed ? 'items-start' : 'sm:flex-row items-center justify-between'} gap-section relative overflow-hidden backdrop-blur-md transition-all ${theme === 'light'
            ? 'bg-gradient-to-r from-orange-400/5 via-rose-500/5 to-orange-400/5 border-orange-500/30'
            : 'bg-gradient-to-r from-orange-400/20 via-rose-500/20 to-orange-400/20 border-orange-400/30'
            }`}
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <div className="absolute top-0 left-0 w-16 h-16 bg-orange-450 rounded-full filter blur-md animate-pulse"></div>
          </div>

          <div className={`flex items-center gap-section z-10 ${isCondensed ? 'w-full' : 'sm:w-auto w-full'}`}>
            <div className="relative">
              <div className={`icon-medium shrink-0 rounded-xl flex items-center justify-center border shadow-md ${theme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB] text-orange-500' : 'bg-[#FCFAF8]/10 border-white/10 text-orange-450'
                }`}>
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
                  <span className={`text-xs font-semibold drop-shadow-sm flex items-center gap-1 min-w-0 ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-200'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-[var(--project-color,orange)] shrink-0`} style={{ backgroundColor: activeProject.color ? `var(--tw-color-${activeProject.color}-500)` : undefined }} />
                    <span className="truncate" title={activeProject.name.length > 512 ? activeProject.name.slice(0, 512) + '...' : activeProject.name}>{activeProject.name}</span>
                  </span>
                )}
              </div>
              <h4 className={`font-sans font-extrabold text-title mt-0.5 leading-snug truncate ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
                }`} title={activeTask?.name?.length && activeTask.name.length > 512 ? activeTask.name.slice(0, 512) + '...' : activeTask?.name}>
                {activeTask?.name}
              </h4>
            </div>
          </div>

          <div className={`flex items-center gap-section z-10 w-full ${isCondensed ? 'justify-between pt-2 border-t' : 'sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-2 sm:pt-0'} ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'
            }`}>
            <div className="text-right">
              <p className={`text-[9px] font-semibold tracking-wider font-mono uppercase ${theme === 'light' ? 'text-[#5A4A42]' : 'text-[#9B8C83]'
                }`}>
                {translate(locale, 'timer', 'RegisteredToday', customTranslations)}
              </p>
              <p id="active-timer-display" className={`text-xl font-extrabold tracking-tight font-mono ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
                }`}>
                {formatSeconds(getTaskDurationSeconds(activeTask?.id || '', tasks, logs, nowIso))}
              </p>
            </div>
            <button
              id="stop-timer-btn"
              onClick={() => onStopTimer()}
              className={`bg-rose-500 hover:bg-rose-600 text-white rounded-section button-h px-3 transition-all duration-300 flex items-center justify-center shadow-md transform active:scale-95 group cursor-pointer`}
            >
              <Square className={`icon-small text-white fill-white group-hover:scale-110 transition-transform`} />
            </button>
          </div>
        </motion.div>
      ) : (
        <div id="active-timer-idle-banner" className={`backdrop-blur-md rounded-main padding-section border flex flex-col ${isCondensed ? 'gap-section' : `md:flex-row items-center justify-between gap-section`} transition-all duration-300 ${theme === 'light'
          ? 'bg-[#FCFAF8] border-[#DFD7CB] shadow-sm shadow-[#DFD7CB]/50'
          : 'bg-[#FCFAF8]/5 border-white/10'
          }`}>
          <div className={`flex items-center gap-section`}>
            <div className={`icon-medium border rounded-section flex items-center justify-center shrink-0 ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
              }`}>
              <Clock className="w-3/5 h-3/5 text-orange-400" />
            </div>
            <div>
              <h4 className={`font-semibold text-title leading-tight ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
                {translate(locale, 'timer', 'AllTrackersStopped', customTranslations)}
              </h4>
              <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>
                {translate(locale, 'timer', 'SelectTaskToPlay', customTranslations)}
              </p>
            </div>
          </div>
          <div className={isCondensed ? 'w-full pt-2 border-t border-[#DFD7CB] dark:border-white/10 text-center' : 'text-right'}>
            <span className={`text-xs border px-2.5 py-1 rounded-full font-mono font-medium whitespace-nowrap inline-block ${theme === 'light'
              ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]'
              : 'bg-[#FCFAF8]/5 text-slate-300 border-white/10'
              }`}>
              {translate(locale, 'engine', 'IdleSqlReady', customTranslations)}
            </span>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
