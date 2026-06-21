import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Minimize2 } from 'lucide-react';
import { useOxyFlow } from '@core/providers/OxyContext';
import { getTranslation } from '@core/i18n/translations';

export default function DaemonStatusBar() {
  const {
    engineState,
    enginePID,
    locale,
    customTranslations,
    logs,
    resolvedTheme,
    handleMinimizeToTray
  } = useOxyFlow();

  const activeRunningLogs = logs.filter(l => l.endTime === null);

  if (engineState === 'searching') {
    return (
      <motion.div 
        id="engine-searching-alert"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs rounded-2xl p-4 flex items-center gap-3 animate-pulse"
      >
        <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
        <div className="flex-1 text-left">
          <strong className="text-white">{getTranslation(locale, 'searchingEngine', customTranslations)}</strong>
          <p className="text-[10px] text-[#9B8C83] mt-0.5">{getTranslation(locale, 'connectingSqlite', customTranslations)}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      id="engine-ready-status-bar"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-emerald-500/5 border border-emerald-500/10 text-xs rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-300'
      }`}
    >
      <div className="flex items-start md:items-center gap-2.5 text-left">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping mt-1 md:mt-0 shrink-0"></div>
        <p className={`text-[11px] leading-relaxed ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
          {getTranslation(locale, 'connectedDaemon', customTranslations)} (PID: <strong className={`font-mono ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>{enginePID}</strong>). <br className="hidden sm:inline md:hidden" />
          {getTranslation(locale, 'engineSynced', customTranslations)} <strong className="text-emerald-500 font-mono">{activeRunningLogs.length}</strong> {getTranslation(locale, 'parallelThreads', customTranslations)}
        </p>
      </div>
      {handleMinimizeToTray && (
        <button
          id="minimize-tray-shortcut"
          onClick={handleMinimizeToTray}
          className={`text-[10px] border px-3 py-1.5 rounded-xl flex items-center shrink-0 justify-center gap-1.5 transition-all cursor-pointer font-mono w-full sm:w-auto font-semibold ${
            resolvedTheme === 'light' 
              ? 'bg-[#FCFAF8] hover:bg-slate-55 text-slate-700 hover:text-[#2C2421] border-[#DFD7CB]' 
              : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/10 text-slate-300 hover:text-white border-white/10'
          }`}
        >
          <Minimize2 className="w-3 h-3 text-orange-400" /> {getTranslation(locale, 'minimizeToTray', customTranslations)}
        </button>
      )}
    </motion.div>
  );
}
