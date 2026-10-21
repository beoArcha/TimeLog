import React from 'react';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { Badge } from '@components/ui/badge';

export const StatusIndicator: React.FC = () => {
  const { engineState } = useWindowShell();

  return (
    <div className="flex items-center gap-1.5" title={engineState === 'searching' ? 'CONNECTING' : 'DAEMON RUNNING'}>
      <div className="sm:hidden flex items-center justify-center p-1">
        <span className={`w-2 h-2 rounded-full ${
          engineState === 'searching' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 ring-2 ring-emerald-500/30'
        }`} />
      </div>

      <Badge
        variant={engineState === 'searching' ? 'amber' : 'emerald'}
        size="xs"
        as="span"
        className="hidden sm:inline-flex whitespace-nowrap"
      >
        {engineState === 'searching' ? 'CONNECTING' : 'DAEMON RUNNING'}
      </Badge>
    </div>
  );
};
