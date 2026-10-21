import React from 'react';
import { Terminal, X } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Heading, MonoText } from '@components/ui/typography';

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
        <Heading level={2} className="text-sm sm:text-base font-bold font-mono tracking-tight text-foreground">
          {title}
        </Heading>
        <div id="cli-drawer-mode-badge" className="ml-2">
          {isSandbox ? (
            <Badge variant="amber" size="sm">
              [{sandboxBadge}]
            </Badge>
          ) : (
            <Badge variant="emerald" size="sm">
              [{liveBadge}]
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <MonoText size="xs" variant="muted" className="hidden sm:inline-block">
          Ctrl+` / Esc
        </MonoText>
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
