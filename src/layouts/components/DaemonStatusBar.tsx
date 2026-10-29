import React, { useState, useEffect } from 'react';
import { AnimatedFade } from '@components/AnimatedFade';
import { RefreshCw, Minimize2 } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { Button } from '@components/ui/button';
import { Caption, Text, MonoText } from '@components/ui/typography';
import { HStack, VStack } from '@components/ui/stack';
import { SyncStatusBadge } from '@components/SyncStatusBadge';
import { WebhookDispatcher, WebhookSyncStatus } from '@common/sinks/WebhookDispatcher';

export default function DaemonStatusBar() {
  const { locale, customTranslations } = useLocale();
  const { logs, engineState } = useData();
  const { handleMinimizeToTray } = useWindowShell();
  const { supportsTray } = usePlatformCapabilities();
  const [syncStatus, setSyncStatus] = useState<WebhookSyncStatus>(
    WebhookDispatcher.getInstance().getStatus()
  );

  useEffect(() => {
    const unsubscribe = WebhookDispatcher.getInstance().subscribe(setSyncStatus);
    return () => unsubscribe();
  }, []);

  const activeRunningLogs = logs.filter(l => l.endTime === null);

  if (engineState === 'connecting') {
    return (
      <AnimatedFade
        id="engine-connecting-status-bar"
        className="bg-card/60 backdrop-blur-md border border-border text-xs rounded-xl py-2 px-3 sm:py-2.5 sm:px-4 flex items-center gap-3 transition-all"
      >
        <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
        <VStack gap="2xs" className="flex-1 text-left">
          <Text as="strong" weight="bold" className="text-foreground">
            {translate(locale, 'engine', 'Searching', customTranslations)}
          </Text>
          <Caption className="mt-0.5">{translate(locale, 'engine', 'Connecting', customTranslations)}</Caption>
        </VStack>
      </AnimatedFade>
    );
  }

  return (
    <AnimatedFade
      id="engine-ready-status-bar"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-emerald-500/5 border border-emerald-500/15 text-xs rounded-xl py-2 px-3 sm:py-2.5 sm:px-4 flex items-center justify-between gap-2.5 transition-all text-muted-foreground"
    >
      <HStack gap="sm" wrap className="text-left min-w-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" aria-hidden="true" />
        <Caption as="p" size="xs" className="truncate leading-tight text-foreground">
          <Text as="span" weight="semibold" className="text-emerald-600 dark:text-emerald-400">
            {translate(locale, 'engine', 'Connected', customTranslations)}
          </Text>
          {' · '}
          <Caption as="span" size="xs">
            {translate(locale, 'engine', 'Synced', customTranslations)}{' '}
            <MonoText as="strong" weight="bold" className="text-emerald-500">
              {activeRunningLogs.length}
            </MonoText>{' '}
            {translate(locale, 'engine', 'Threads', customTranslations)}
          </Caption>
        </Caption>

        <SyncStatusBadge
          status={syncStatus}
          onRetry={() => WebhookDispatcher.getInstance().retryNow()}
        />
      </HStack>

      {supportsTray && handleMinimizeToTray && (
        <Button
          id="minimize-tray-shortcut"
          data-testid="minimize-tray-shortcut"
          variant="outline"
          size="xs"
          onClick={handleMinimizeToTray}
          className="flex items-center shrink-0 justify-center gap-1.5 transition-all cursor-pointer font-mono font-semibold bg-card hover:bg-muted text-foreground border-border"
          title={translate(locale, 'engine', 'MinimizeToTray', customTranslations)}
        >
          <Minimize2 className="w-3 h-3 text-orange-400" />
          <Caption as="span" size="xs" weight="semibold" className="hidden sm:inline">
            {translate(locale, 'engine', 'MinimizeToTray', customTranslations)}
          </Caption>
        </Button>
      )}
    </AnimatedFade>
  );
}
