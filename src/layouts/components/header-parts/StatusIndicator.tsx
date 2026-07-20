import React from 'react';
import { useSettings } from '@common/hooks/SettingsContext';
import { useEngine } from '@common/hooks/EngineContext';

export const StatusIndicator: React.FC = () => {
  const { resolvedTheme } = useSettings();
  const { engineState } = useEngine();;

  return (
    <div className="flex items-center gap-3">
      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold hidden sm:inline ${
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
