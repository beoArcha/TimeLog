import React from 'react';
import { Terminal, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { StatusDot } from '@components/ui/status-dot';
import { SegmentedControl, type SegmentedControlOption } from '@components/SegmentedControl';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import metadata from '@/metadata.json';

export interface CliHeaderProps {
  version?: string;
  isSandbox?: boolean;
  onToggleSandbox?: (enabled: boolean) => void;
}

export const CliHeader: React.FC<CliHeaderProps> = ({
  version = metadata.version,
  isSandbox = false,
  onToggleSandbox,
}) => {
  const { locale, customTranslations } = useSafeLocale();

  const liveLabel = translate(locale, 'cli', 'CliModeLive', customTranslations);
  const sandboxLabel = translate(locale, 'cli', 'CliModeSandbox', customTranslations);

  const modeOptions: SegmentedControlOption<string>[] = [
    { value: 'live', label: liveLabel, icon: ShieldCheck },
    { value: 'sandbox', label: sandboxLabel, icon: Sparkles },
  ];

  return (
    <div id="cli-header" className="flex items-center justify-between border-b border-border pb-3 gap-2 flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="w-3 h-3 rounded-full bg-rose-500 block" />
          <span className="w-3 h-3 rounded-full bg-amber-500 block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
        </div>
        <span className="text-xs font-mono flex items-center gap-1.5 ml-2 text-muted-foreground">
          <Terminal className="w-3.5 h-3.5 text-orange-500" />
          TimeLog by oXyFlow Engine CLI Shell (127.0.0.1) v{version}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <StatusDot
          variant={isSandbox ? 'amber' : 'emerald'}
          size="xs"
          ping
          aria-hidden="true"
        />
        {onToggleSandbox ? (
          <div id="cli-mode-toggle" className="font-mono text-xs">
            <SegmentedControl
              value={isSandbox ? 'sandbox' : 'live'}
              onChange={(val) => onToggleSandbox(val === 'sandbox')}
              size="xs"
              options={modeOptions}
            />
          </div>
        ) : (
          <Badge variant="outline" size="sm" className="font-mono flex items-center gap-1 text-muted-foreground">
            <ShieldCheck className="w-3 h-3 text-orange-500" />
            {isSandbox ? 'Sandbox Memory Simulator' : 'Rust CLI client emulator'}
          </Badge>
        )}
      </div>
    </div>
  );
};
