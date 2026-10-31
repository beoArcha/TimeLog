import React from 'react';
import { useDataLifecycleState } from '@common/hooks/DataContext';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { useTranslation } from '@common/i18n/translator';
import { Badge } from '@components/ui/badge';
import { HStack } from '@components/ui/stack';

export const StatusIndicator: React.FC = () => {
  const { engineState } = useDataLifecycleState();
  const { hasNativeDaemon } = usePlatformCapabilities();
  const { t } = useTranslation('engine');

  if (hasNativeDaemon === false) {
    const label = t('PwaOnlineReady');
    return (
      <HStack gap="xs" title={label}>
        <div className="sm:hidden flex items-center justify-center p-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
        </div>

        <Badge
          variant="emerald"
          size="xs"
          as="span"
          className="hidden sm:inline-flex whitespace-nowrap"
        >
          {label}
        </Badge>
      </HStack>
    );
  }

  const isSearching = engineState === 'searching';
  const label = isSearching ? 'CONNECTING' : 'DAEMON RUNNING';

  return (
    <HStack gap="xs" title={label}>
      <div className="sm:hidden flex items-center justify-center p-1">
        <span className={`w-2 h-2 rounded-full ${
          isSearching ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 ring-2 ring-emerald-500/30'
        }`} />
      </div>

      <Badge
        variant={isSearching ? 'amber' : 'emerald'}
        size="xs"
        as="span"
        className="hidden sm:inline-flex whitespace-nowrap"
      >
        {label}
      </Badge>
    </HStack>
  );
};
