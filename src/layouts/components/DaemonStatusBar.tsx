import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Minimize2 } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useData } from '@common/hooks/DataContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';

export default function DaemonStatusBar() {
  const { locale, customTranslations } = useLocale();
  const { resolvedTheme } = useSettings();
  const { logs, engineState } = useData();
  const { handleMinimizeToTray } = useWindowShell();


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
          <strong className="text-white">{translate(locale, 'engine', 'Searching', customTranslations)}</strong>
          <p className="text-[10px] text-[#9B8C83] mt-0.5">{translate(locale, 'engine', 'Connecting', customTranslations)}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      id="engine-ready-status-bar"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-emerald-500/5 border border-emerald-500/15 text-xs rounded-xl py-2 px-3 sm:py-2.5 sm:px-4 flex items-center justify-between gap-2.5 transition-all ${
        resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 text-left min-w-0">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
        <p className={`text-[11px] truncate leading-tight ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {translate(locale, 'engine', 'Connected', customTranslations)}
          </span>
          {' · '}
          <span>{translate(locale, 'engine', 'Synced', customTranslations)} <strong className="text-emerald-500 font-mono">{activeRunningLogs.length}</strong> {translate(locale, 'engine', 'Threads', customTranslations)}</span>
        </p>
      </div>
      {handleMinimizeToTray && (
        <button
          id="minimize-tray-shortcut"
          onClick={handleMinimizeToTray}
          className={`text-[10px] border px-2.5 py-1 rounded-lg flex items-center shrink-0 justify-center gap-1.5 transition-all cursor-pointer font-mono font-semibold ${
            resolvedTheme === 'light'
              ? 'bg-[#FCFAF8] hover:bg-slate-100 text-slate-700 hover:text-[#2C2421] border-[#DFD7CB]'
              : 'bg-[#FCFAF8]/5 hover:bg-[#FCFAF8]/10 text-slate-300 hover:text-white border-white/10'
          }`}
          title={translate(locale, 'engine', 'MinimizeToTray', customTranslations)}
        >
          <Minimize2 className="w-3 h-3 text-orange-400" />
          <span className="hidden sm:inline">{translate(locale, 'engine', 'MinimizeToTray', customTranslations)}</span>
        </button>
      )}
    </motion.div>
  );
}
