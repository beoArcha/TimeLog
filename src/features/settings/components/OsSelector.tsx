import React from 'react';
import { Button } from '@components/ui/button';
import { HStack } from '@components/ui/stack';

export type SupportedOs = 'windows' | 'macos' | 'linux';

export interface OsSelectorProps {
  currentOs: SupportedOs;
  onSelectOs: (os: SupportedOs) => void;
}

const OS_OPTIONS: readonly SupportedOs[] = ['windows', 'macos', 'linux'] as const;

export function OsSelector({ currentOs, onSelectOs }: OsSelectorProps) {
  return (
    <HStack gap="sm">
      {OS_OPTIONS.map((os) => {
        const isSelected = currentOs === os;
        return (
          <Button
            key={os}
            type="button"
            variant={isSelected ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSelectOs(os)}
            className={`text-xs px-3 py-1 rounded-lg capitalize font-mono font-bold transition-all h-auto ${
              isSelected
                ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/35 text-orange-400'
                : 'text-slate-400'
            }`}
          >
            {os}
          </Button>
        );
      })}
    </HStack>
  );
}

export default OsSelector;
