import React from 'react';
import { Terminal, X } from 'lucide-react';
import { Button } from '@components/ui/button';

export interface CliDrawerHeaderProps {
  title: string;
  closeLabel: string;
  isSandbox: boolean;
  liveBadge: string;
  sandboxBadge: string;
  onClose: () => void;
}

export const CliDrawerHeader: React.FC<CliDrawerHeaderProps> = ({
  title,
  closeLabel,
  isSandbox,
  liveBadge,
  sandboxBadge,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between pb-3 mb-2 border-b border-border select-none">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <Terminal className="w-5 h-5" />
        </div>
        <h2 className="text-sm sm:text-base font-bold font-mono tracking-tight text-foreground">
          {title}
        </h2>
        <div id="cli-drawer-mode-badge" className="ml-2">
          {isSandbox ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
              [{sandboxBadge}]
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              [{liveBadge}]
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-block text-[11px] text-muted-foreground font-mono">
          Ctrl+` / Esc
        </span>
        <Button
          id="cli-drawer-close-btn"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={closeLabel}
          className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
