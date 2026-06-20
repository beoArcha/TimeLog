import React from 'react';
import { Clock, Maximize2, X, ChevronDown, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translate } from '../../utils/i18n';
import versionsData from '../../versions.json';
import type { GuiRouterProps } from './GuiRouter';
import { GuiState } from './useGuiLogic';
import { useOxyFlow } from '../../hooks/useOxyFlow';

type SmallGuiProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function SmallGui({ state, ...rest }: SmallGuiProps) {
  const {
    isSmallExpanded,
    setIsSmallExpanded,
    showToast,
    handleMinimizeToTray,
    setGuiSize,
    currentProjectId,
    lastNonSmallVariant
  } = rest;


  const {
    projects,
    tasks,
    activeLog,
    theme,
    locale,
    customTranslations
  } = state;
  const resolvedTheme = theme;

  const { alwaysOnTopSmall, setAlwaysOnTopSmall } = useOxyFlow();

  const handleStartTimer = (taskId: string) => {
    state.onStartTimer(taskId);
  };

  const handleStopTimer = () => {
    state.onStopTimer();
  };

  const activeProj = projects.find(p => p.id === currentProjectId) || projects[0];

  return (
    <motion.div
      key="small-state"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="w-full h-full flex flex-col p-1"
    >
      <div className={`rounded-2xl border shadow-2xl p-3 flex flex-col gap-2.5 relative overflow-hidden transition-all duration-300 w-full h-full ${resolvedTheme === 'light'
          ? 'bg-white border-slate-200 text-slate-800'
          : resolvedTheme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-slate-950/95 backdrop-blur-xl border-white/10 text-white'
        }`}>

        {resolvedTheme !== 'high-contrast' && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-rose-500 to-indigo-500"></div>
        )}

        <div
          className="flex items-center justify-between border-b pb-2 border-white/10 select-none"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-450 border border-orange-505/30">
              <Clock className="w-3 h-3 text-orange-400 animate-pulse" />
            </div>
            <span className="font-sans font-bold text-[10px] tracking-tight">LogTime by OxyFlow v{versionsData.major}.{versionsData.minor}.{versionsData.release}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-0.5 font-mono text-[10px] mr-1 text-slate-400 hover:text-orange-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={alwaysOnTopSmall}
                onChange={(e) => {
                  setAlwaysOnTopSmall(e.target.checked);
                  showToast(e.target.checked ? translate(locale, 'smallGuiWidget.onTopOn', customTranslations) : translate(locale, 'smallGuiWidget.onTopOff', customTranslations));
                }}
                className="w-3 h-3 rounded select-none accent-orange-500 cursor-pointer"
              />
              <span>Top</span>
            </label>
            <button
              onClick={() => {
                const target = lastNonSmallVariant || 'large';
                setGuiSize(target);
                showToast(locale === 'pl' ? `Rozmiar zmieniony na ${target === 'medium' ? 'ŚREDNI' : 'DUŻY'}` : `Size changed to ${target.toUpperCase()}`);
              }}
              className="p-1 rounded hover:bg-white/10 hover:text-orange-400 text-slate-400 cursor-pointer transition-colors flex items-center justify-center"
              title={locale === 'pl' ? "Przywróć większy rozmiar" : "Restore larger size"}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleMinimizeToTray()}
              className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 cursor-pointer transition-colors flex items-center justify-center"
              title={locale === 'pl' ? "Zamknij / Ukryj do Tray" : "Close / Hide to Tray"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-1">
          {activeProj && (
            <div className="flex items-center gap-2 truncate">
              <span className={`w-3 h-3 rounded-full bg-${activeProj.color || 'rose'}-500 shrink-0 shadow-sm`} />
              <div className="text-left">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">{translate(locale, 'smallGuiWidget.appProfile', customTranslations)}</p>
                <h4 className={`text-xs font-bold font-sans mt-0.5 truncate max-w-[220px] ${resolvedTheme === 'light' ? 'text-slate-800' : 'text-slate-200'
                  }`} title={activeProj.name}>
                  {activeProj.name}
                </h4>
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 text-center">
          <button
            onClick={() => setIsSmallExpanded(!isSmallExpanded)}
            className={`w-full py-1 rounded-xl transition-all font-mono text-[9px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${resolvedTheme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
          >
            <span>{isSmallExpanded ? translate(locale, 'smallGuiWidget.hideTasks', customTranslations) : translate(locale, 'smallGuiWidget.showTasks', customTranslations)}</span>
            <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 text-orange-400 ${isSmallExpanded ? 'rotate-180' : ''
                }`} />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {isSmallExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 text-left"
            >
              {(() => {
                if (!activeProj) return <p className="text-xs italic text-slate-400 text-center py-4">{translate(locale, 'dynamic.noProjects', customTranslations)}</p>;

                const projRootTasks = tasks.filter(t => t.projectId === activeProj.id && t.parentTaskId === null);

                if (projRootTasks.length === 0) {
                  return <p className="text-xs italic text-slate-400 text-center py-4">{translate(locale, 'dynamic.noTasksInProfile', customTranslations)}</p>;
                }

                return (
                  <div className="flex flex-col gap-2.5">
                    {projRootTasks.map(task => {
                      const isRootActive = activeLog && activeLog.taskId === task.id;
                      const subtasks = tasks.filter(t => t.parentTaskId === task.id);

                      return (
                        <div key={task.id} className={`p-2 rounded-xl transition-colors border ${resolvedTheme === 'light'
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white/5 border-white/5'
                          }`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold truncate flex-1 ${task.completed ? 'line-through text-slate-500' : ''
                              }`}>
                              {task.name}
                            </span>

                            <button
                              onClick={() => {
                                if (isRootActive) {
                                  handleStopTimer();
                                  showToast(`${translate(locale, 'smallGuiWidget.stoppedMeasurement', customTranslations)}${task.name}`);
                                } else {
                                  handleStartTimer(task.id);
                                  showToast(`${translate(locale, 'smallGuiWidget.startedMeasurement', customTranslations)}${task.name}`);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer ${isRootActive
                                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                                  : 'bg-emerald-500/20 text-emerald-450 border border-emerald-500/30'
                                }`}
                              title={isRootActive ? translate(locale, 'smallGuiWidget.stopMeasurement', customTranslations) : translate(locale, 'smallGuiWidget.startMeasurement', customTranslations)}
                            >
                              {isRootActive ? <Square className="w-3.5 h-3.5 fill-rose-500" /> : <Play className="w-3.5 h-3.5 fill-emerald-500" />}
                            </button>
                          </div>

                          {subtasks.length > 0 && (
                            <div className="flex flex-col gap-1.5 pl-3.5 mt-1.5 border-l border-white/10">
                              {subtasks.map(sub => {
                                const isSubActive = activeLog && activeLog.taskId === sub.id;

                                return (
                                  <div key={sub.id} className="flex items-center justify-between gap-2 py-0.5">
                                    <span className={`text-[11px] truncate flex-1 ${sub.completed ? 'line-through text-slate-500' : 'text-slate-300'
                                      }`}>
                                      ↳ {sub.name}
                                    </span>

                                    <button
                                      onClick={() => {
                                        if (isSubActive) {
                                          handleStopTimer();
                                          showToast(`${translate(locale, 'smallGuiWidget.stoppedSubtask', customTranslations)}${sub.name}`);
                                        } else {
                                          handleStartTimer(sub.id);
                                          showToast(`${translate(locale, 'smallGuiWidget.startedSubtask', customTranslations)}${sub.name}`);
                                        }
                                      }}
                                      className={`p-1 rounded-md transition-all cursor-pointer ${isSubActive
                                          ? 'bg-rose-500/25 text-rose-550'
                                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                        }`}
                                    >
                                      {isSubActive ? <Square className="w-2.5 h-2.5 fill-rose-500" /> : <Play className="w-2.5 h-2.5 fill-emerald-500" />}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
