import React from 'react';
import { useSettings } from '@common/hooks/SettingsContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';

export const StatusIndicator: React.FC = () => {
  const { resolvedTheme } = useSettings();
  const { engineState } = useWindowShell();

  return (
    <div className="flex items-center gap-1.5" title={engineState === 'searching' ? 'CONNECTING' : 'DAEMON RUNNING'}>
      {/* Mobile mini dot indicator */}
      <div className="sm:hidden flex items-center justify-center p-1">
        <span className={`w-2 h-2 rounded-full ${
          engineState === 'searching' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 ring-2 ring-emerald-500/30'
        }`} />
      </div>

      {/* Expanded badge on tablet/desktop */}
      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold hidden sm:inline whitespace-nowrap ${
        engineState === 'searching'
          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-350 animate-pulse border border-amber-500/20'
          : resolvedTheme === 'light'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
      }`}>
        {engineState === 'searching' ? 'CONNECTING' : 'DAEMON RUNNING'}
      </span>
    </div>
  );
};
