import React from 'react';
import { RefreshCw, CloudUpload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Caption } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { translate } from '@common/i18n/translator';
import { useSafeLocale } from '@common/hooks/LocaleProvider';

import type { SyncStateType, SyncStatusSnapshot } from '@common/types/sync';

export type { SyncStateType, SyncStatusSnapshot };

export interface SyncStatusBadgeProps {
  status: SyncStatusSnapshot;
  onRetry?: () => void;
  className?: string;
  testId?: string;
}

/**
 * Composite badge representing asynchronous synchronization states (idle, syncing, queued, error)
 * with an optional inline action to retry failed attempts.
 */
export function SyncStatusBadge({
  status,
  onRetry,
  className = 'flex items-center gap-1.5 font-mono bg-card/60 font-normal',
  testId = 'webhook-sync-indicator',
}: SyncStatusBadgeProps) {
  const { locale, customTranslations } = useSafeLocale();

  return (
    <Badge
      variant="outline"
      size="sm"
      data-testid={testId}
      className={className}
    >
      {status.state === 'idle' && (
        <HStack as="span" gap="2xs" className="text-muted-foreground">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <Caption as="span" size="2xs">
            {translate(locale, 'engine', 'SyncStatusOk', customTranslations)}
          </Caption>
        </HStack>
      )}

      {status.state === 'syncing' && (
        <HStack as="span" gap="2xs" className="text-sky-500">
          <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
          <Caption as="span" size="2xs">
            {translate(locale, 'engine', 'SyncStatusSyncing', customTranslations)}
          </Caption>
        </HStack>
      )}

      {status.state === 'queued' && (
        <HStack as="span" gap="xs" className="text-amber-500">
          <CloudUpload className="w-3 h-3 animate-pulse shrink-0" />
          <Caption as="span" size="2xs">
            {status.pendingCount} {translate(locale, 'engine', 'SyncStatusQueued', customTranslations)}
          </Caption>
          {onRetry && (
            <Button
              variant="ghost"
              size="xs"
              data-testid="webhook-retry-now-btn"
              onClick={onRetry}
              className="h-4 px-1.5 text-amber-500 hover:text-amber-400"
            >
              {translate(locale, 'engine', 'RetryNow', customTranslations)}
            </Button>
          )}
        </HStack>
      )}

      {status.state === 'error' && (
        <HStack as="span" gap="xs" className="text-rose-500">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <Caption as="span" size="2xs">
            {status.failedCount} {translate(locale, 'engine', 'SyncStatusError', customTranslations)}
          </Caption>
          {onRetry && (
            <Button
              variant="ghost"
              size="xs"
              data-testid="webhook-retry-now-btn"
              onClick={onRetry}
              className="h-4 px-1.5 text-rose-500 hover:text-rose-400"
            >
              {translate(locale, 'engine', 'RetryNow', customTranslations)}
            </Button>
          )}
        </HStack>
      )}
    </Badge>
  );
}

export default SyncStatusBadge;
