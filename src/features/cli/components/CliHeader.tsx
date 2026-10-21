import React from 'react';
import { Terminal, ShieldCheck } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import versionsData from '@app/versions.json';

export interface CliHeaderProps {
  version?: string;
  isSandbox?: boolean;
}

export const CliHeader: React.FC<CliHeaderProps> = ({
  version = `${versionsData.major}.${versionsData.minor}.${versionsData.release}`,
  isSandbox = false
}) => {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-rose-500 block" />
          <span className="w-3 h-3 rounded-full bg-amber-500 block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
        </div>
        <span className="text-xs font-mono flex items-center gap-1.5 ml-2 text-muted-foreground">
          <Terminal className="w-3.5 h-3.5 text-orange-500" />
          LogTime by OxyFlow Engine CLI Shell (127.0.0.1) v{version}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
        </span>
        <Badge variant="outline" size="sm" className="font-mono flex items-center gap-1 text-muted-foreground">
          <ShieldCheck className="w-3 h-3 text-orange-500" />
          {isSandbox ? 'Sandbox Memory Simulator' : 'Rust CLI client emulator'}
        </Badge>
      </div>
    </div>
  );
};
