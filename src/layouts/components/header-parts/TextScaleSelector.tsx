import React from 'react';
import { useSettings } from '@common/hooks/SettingsContext';
import { Button } from '@components/ui/button';

export const TextScaleSelector: React.FC = () => {
  const { textAndIconSize, setTextAndIconSize } = useSettings();

  return (
    <div className="flex p-0.5 rounded-lg border border-border bg-muted/40 transition-all duration-300 text-xs font-sans">
      {(['small', 'medium', 'large'] as const).map(scale => {
        const isActive = textAndIconSize === scale;
        const textSize = scale === 'small' ? 'text-xs' : scale === 'medium' ? 'text-sm' : 'text-base';
        return (
          <Button
            key={scale}
            variant="ghost"
            size="xs"
            data-testid={`text-scale-${scale}`}
            onClick={() => setTextAndIconSize(scale)}
            className={`px-2.5 py-0.5 h-auto rounded-md uppercase transition-all cursor-pointer flex flex-col items-center justify-center min-w-[32px] ${
              isActive
                ? 'bg-card text-primary border border-border shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={`font-serif leading-none font-bold ${textSize}`}>A</span>
          </Button>
        );
      })}
    </div>
  );
};
