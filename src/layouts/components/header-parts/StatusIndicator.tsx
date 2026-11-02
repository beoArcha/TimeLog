import React from 'react';
import { useDataLifecycleState } from '@common/hooks/DataContext';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { useTranslation } from '@common/i18n/translator';
import { Badge } from '@components/ui/badge';
import { StatusDot } from '@components/ui/status-dot';
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
          <StatusDot variant="emerald" size="xs" className="ring-2 ring-emerald-500/30" />
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
        <StatusDot
          variant={isSearching ? 'amber' : 'emerald'}
          size="xs"
          ping={isSearching}
          className={!isSearching ? 'ring-2 ring-emerald-500/30' : undefined}
        />
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
