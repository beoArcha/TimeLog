import React from 'react';
import { RefreshCw, CloudUpload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Caption } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { translate } from '@common/i18n/translator';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { cn } from '@/lib/utils';

import type { SyncStateType, SyncStatusSnapshot } from '@common/types/sync';

export type { SyncStateType, SyncStatusSnapshot };

export interface SyncStatusBadgeProps {
  status: SyncStatusSnapshot;
  onRetry?: () => void;
  className?: string;
  testId?: string;
}

type SyncTranslationKey =
  | 'SyncStatusOk'
  | 'SyncStatusSyncing'
  | 'SyncStatusQueued'
  | 'SyncStatusError';

interface StateActionConfig {
  buttonClass: string;
}

export interface StateConfigItem {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  animationClass?: string;
  iconClass?: string;
  containerClass: string;
  gap: '2xs' | 'xs';
  labelKey: SyncTranslationKey;
  getLabel: (
    status: SyncStatusSnapshot,
    t: (key: SyncTranslationKey) => string
  ) => string;
  action?: StateActionConfig;
}

const STATE_CONFIG: Record<SyncStateType, StateConfigItem> = {
  idle: {
    icon: CheckCircle2,
    iconClass: 'text-success',
    containerClass: 'text-muted-foreground',
    gap: '2xs',
    labelKey: 'SyncStatusOk',
    getLabel: (_status, t) => t('SyncStatusOk'),
  },
  syncing: {
    icon: RefreshCw,
    animationClass: 'animate-spin',
    containerClass: 'text-info',
    gap: '2xs',
    labelKey: 'SyncStatusSyncing',
    getLabel: (_status, t) => t('SyncStatusSyncing'),
  },
  queued: {
    icon: CloudUpload,
    animationClass: 'animate-pulse',
    containerClass: 'text-warning',
    gap: 'xs',
    labelKey: 'SyncStatusQueued',
    getLabel: (status, t) => `${status.pendingCount ?? 0} ${t('SyncStatusQueued')}`,
    action: {
      buttonClass: 'min-h-[24px] h-6 px-1.5 text-warning hover:text-warning/80',
    },
  },
  error: {
    icon: AlertCircle,
    containerClass: 'text-destructive',
    gap: 'xs',
    labelKey: 'SyncStatusError',
    getLabel: (status, t) => `${status.failedCount ?? 0} ${t('SyncStatusError')}`,
    action: {
      buttonClass: 'min-h-[24px] h-6 px-1.5 text-destructive hover:text-destructive/80',
    },
  },
};

/**
 * Badge representing synchronization states (idle, syncing, queued, error)
 * with an optional inline action to retry failed attempts.
 */
export function SyncStatusBadge({
  status,
  onRetry,
  className = 'flex items-center gap-1.5 font-mono bg-card/60 font-normal',
  testId = 'webhook-sync-indicator',
}: SyncStatusBadgeProps) {
  const { locale, customTranslations } = useSafeLocale();
  const config = STATE_CONFIG[status.state];

  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const label = config.getLabel(status, (key) =>
    translate(locale, 'engine', key, customTranslations)
  );

  return (
    <Badge
      variant="outline"
      size="sm"
      role="status"
      aria-live="polite"
      data-testid={testId}
      className={className}
    >
      <HStack as="span" gap={config.gap} className={config.containerClass}>
        <Icon
          className={cn('w-3 h-3 shrink-0', config.animationClass, config.iconClass)}
          aria-hidden="true"
        />
        <Caption as="span" size="2xs">
          {label}
        </Caption>
        {config.action && onRetry && (
          <Button
            variant="ghost"
            size="xs"
            data-testid={`${testId}-retry-btn`}
            onClick={onRetry}
            className={config.action.buttonClass}
          >
            {translate(locale, 'engine', 'RetryNow', customTranslations)}
          </Button>
        )}
      </HStack>
    </Badge>
  );
}

export default SyncStatusBadge;