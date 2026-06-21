import React from 'react';
import { AppWindow, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useOxyFlow } from '@core/providers/OxyContext';
import { translate } from '@core/i18n/i18n';

interface TrayWidgetProps {
  onRestore: () => void;
  onStopAll: () => void;
  showToast: (msg: string) => void;
}

export default function TrayWidget({ onRestore, onStopAll }: TrayWidgetProps) {
  const {
    projects,
    tasks,
    logs,
    enginePID,
    resolvedTheme,
    nowIso,
    locale,
    customTranslations
  } = useOxyFlow();

  const activeRunningLogs = logs.filter(l => l.endTime === null);

  return (
    <motion.div
      id="simulated-tray-widget"
      key="tray-state"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-auto py-16 px-4"
    >
      <div className={`rounded-[2.5rem] p-8 shadow-3xl w-full text-center flex flex-col items-center gap-6 relative overflow-hidden group border transition-all duration-300 ${resolvedTheme === 'light'
          ? 'bg-white border-slate-200'
          : resolvedTheme === 'high-contrast'
            ? 'bg-black border-2 border-white'
            : 'bg-slate-900/60 backdrop-blur-2xl border-white/10'
        }`}>
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 via-rose-500 to-indigo-500"></div>

        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-400 to-rose-500 shadow-2xl flex items-center justify-center text-white transform hover:rotate-6 transition-transform">
            <Layers className="w-10 h-10 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className={`relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 ${resolvedTheme === 'light' ? 'border-white' : 'border-slate-900'
              }`}></span>
          </span>
        </div>

        <div>
          <h1 className={`font-heading font-extrabold text-2xl tracking-tight flex items-center gap-2 justify-center ${resolvedTheme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
            OxyFlow Engine
            <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold font-mono tracking-wider uppercase">
              {translate(locale, 'trayWidget.engineRunningBackground', customTranslations)}
            </span>
          </h1>
          <p className={`text-sm mt-2 max-w-md font-sans ${resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-300'
            }`}>
            {translate(locale, 'trayWidget.trayDescription', customTranslations)}
          </p>
          <div className={`text-xs px-4 py-2 rounded-xl font-mono inline-block mt-4 border ${resolvedTheme === 'light'
              ? 'bg-slate-100 border-slate-200 text-slate-700'
              : 'bg-white/5 border-white/10 text-slate-300'
            }`}>
            {translate(locale, 'trayWidget.daemonEnginePid', customTranslations)} <strong className="text-orange-500 font-bold">{enginePID || 8421}</strong> {translate(locale, 'trayWidget.sqliteThread', customTranslations)}
          </div>
        </div>

        {/* Dynamic Running Parallel Projects List */}
        <div className={`w-full rounded-2xl p-4 text-left border max-h-[180px] overflow-y-auto ${resolvedTheme === 'light'
            ? 'bg-slate-50 border-slate-200'
            : resolvedTheme === 'high-contrast'
              ? 'bg-black border-white border-2'
              : 'bg-black/30 border-white/5'
          }`}>
          <p className={`text-[10px] font-mono uppercase tracking-widest mb-3 border-b pb-1.5 ${resolvedTheme === 'light' ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-white/5'
            }`}>
            {translate(locale, 'trayWidget.activeMeasuringThreads', customTranslations)} ({activeRunningLogs.length})
          </p>
          {activeRunningLogs.length === 0 ? (
            <p className={`text-xs italic text-center py-2 ${resolvedTheme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {translate(locale, 'dynamic.noActiveTimersThisMoment', customTranslations)}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activeRunningLogs.map(l => {
                const proj = projects.find(p => p.id === l.projectId);
                const taskObj = tasks.find(t => t.id === l.taskId);
                const start = new Date(l.startTime).getTime();
                const elapsed = Math.max(0, Math.floor((new Date(nowIso).getTime() - start) / 1000));

                const hrs = Math.floor(elapsed / 3600);
                const mins = Math.floor((elapsed % 3600) / 60);
                const secs = elapsed % 60;
                const timeStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

                return (
                  <div key={l.id} className={`flex items-center justify-between text-xs p-2.5 rounded-xl border ${resolvedTheme === 'light'
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-white/5 border-white/10 text-slate-200'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full bg-${proj?.color || 'rose'}-500 shadow-md`} />
                      <span className="font-semibold truncate max-w-[140px] sm:max-w-xs">{taskObj?.name}</span>
                    </div>
                    <span className="font-mono text-emerald-550 dark:text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-1 rounded-md">
                      {timeStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            id="tray-restore-btn"
            onClick={onRestore}
            className="flex-1 bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-semibold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            <AppWindow className="w-4.5 h-4.5" />
            {translate(locale, 'trayWidget.maximizeAndRestore', customTranslations)}
          </button>
          <button
            id="tray-kill-all-btn"
            onClick={onStopAll}
            disabled={activeRunningLogs.length === 0}
            className={`py-3.5 px-6 rounded-2xl text-sm font-semibold border transition-all ${activeRunningLogs.length === 0
                ? 'bg-transparent text-slate-400 border-slate-200/20 cursor-not-allowed opacity-40'
                : resolvedTheme === 'light'
                  ? 'bg-slate-100 hover:bg-rose-50 text-rose-650 border-slate-200 cursor-pointer'
                  : 'bg-white/5 hover:bg-rose-550/15 text-rose-400 border-white/10 hover:border-rose-500/20 cursor-pointer'
              }`}
          >
            {translate(locale, 'trayWidget.pauseAllProcesses', customTranslations)}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
