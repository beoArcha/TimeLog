import React from 'react';
import { useSettings } from '@common/hooks/SettingsContext';
import { Button } from '@components/ui/button';

export const TextScaleSelector: React.FC = () => {
  const { textAndIconSize, setTextAndIconSize, resolvedTheme } = useSettings();

  return (
    <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
      resolvedTheme === 'light' ? 'bg-muted/40 border-border' : 'bg-slate-950/40 border-white/10'
    }`}>
      {(['small', 'medium', 'large'] as const).map(scale => {
        const isActive = textAndIconSize === scale;
        const textSize = scale === 'small' ? 'text-[9px]' : scale === 'medium' ? 'text-[11px]' : 'text-[13px]';
        return (
          <Button
            key={scale}
            variant="ghost"
            size="xs"
            data-testid={`text-scale-${scale}`}
            onClick={() => setTextAndIconSize(scale)}
            className={`px-2.5 py-0.5 h-auto rounded-md uppercase transition-all cursor-pointer flex flex-col items-center justify-center min-w-[32px] ${isActive
              ? resolvedTheme === 'light'
                ? 'bg-card text-indigo-600 border border-border shadow-xs font-bold'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
              : resolvedTheme === 'light'
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-muted-foreground hover:text-white'
              }`}
          >
            <span className={`font-serif leading-none font-bold ${textSize}`}>A</span>
          </Button>
        );
      })}
    </div>
  );
};
