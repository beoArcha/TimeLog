import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Minimize2, CloudUpload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Caption } from '@components/ui/typography';
import { WebhookDispatcher, WebhookSyncStatus } from '@common/sinks/WebhookDispatcher';

export default function DaemonStatusBar() {
  const { locale, customTranslations } = useLocale();
  const { logs, engineState } = useData();
  const { handleMinimizeToTray } = useWindowShell();
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
      <motion.div
        id="engine-connecting-status-bar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card/60 backdrop-blur-md border border-border text-xs rounded-xl py-2 px-3 sm:py-2.5 sm:px-4 flex items-center gap-3 transition-all"
      >
        <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
        <div className="flex-1 text-left">
          <strong className="text-white">{translate(locale, 'engine', 'Searching', customTranslations)}</strong>
          <Caption className="mt-0.5">{translate(locale, 'engine', 'Connecting', customTranslations)}</Caption>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      id="engine-ready-status-bar"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-emerald-500/5 border border-emerald-500/15 text-xs rounded-xl py-2 px-3 sm:py-2.5 sm:px-4 flex items-center justify-between gap-2.5 transition-all text-muted-foreground"
    >
      <div className="flex items-center gap-2 text-left min-w-0 flex-wrap">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
        <Caption as="p" size="xs" className="truncate leading-tight text-foreground">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {translate(locale, 'engine', 'Connected', customTranslations)}
          </span>
          {' · '}
          <span>{translate(locale, 'engine', 'Synced', customTranslations)} <strong className="text-emerald-500 font-mono">{activeRunningLogs.length}</strong> {translate(locale, 'engine', 'Threads', customTranslations)}</span>
        </Caption>

        <Badge
          variant="outline"
          size="sm"
          data-testid="webhook-sync-indicator"
          className="flex items-center gap-1.5 font-mono bg-card/60 font-normal"
        >
          {syncStatus.state === 'idle' && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{translate(locale, 'engine', 'SyncStatusOk', customTranslations)}</span>
            </span>
          )}
          {syncStatus.state === 'syncing' && (
            <span className="flex items-center gap-1 text-sky-500">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>{translate(locale, 'engine', 'SyncStatusSyncing', customTranslations)}</span>
            </span>
          )}
          {syncStatus.state === 'queued' && (
            <span className="flex items-center gap-1.5 text-amber-500">
              <CloudUpload className="w-3 h-3 animate-pulse" />
              <span>
                {syncStatus.pendingCount} {translate(locale, 'engine', 'SyncStatusQueued', customTranslations)}
              </span>
              <Button
                variant="ghost"
                size="xs"
                data-testid="webhook-retry-now-btn"
                onClick={() => WebhookDispatcher.getInstance().retryNow()}
                className="h-4 px-1.5 text-amber-500 hover:text-amber-400"
              >
                {translate(locale, 'engine', 'RetryNow', customTranslations)}
              </Button>
            </span>
          )}
          {syncStatus.state === 'error' && (
            <span className="flex items-center gap-1.5 text-rose-500">
              <AlertCircle className="w-3 h-3" />
              <span>
                {syncStatus.failedCount} {translate(locale, 'engine', 'SyncStatusError', customTranslations)}
              </span>
              <Button
                variant="ghost"
                size="xs"
                data-testid="webhook-retry-now-btn"
                onClick={() => WebhookDispatcher.getInstance().retryNow()}
                className="h-4 px-1.5 text-rose-500 hover:text-rose-400"
              >
                {translate(locale, 'engine', 'RetryNow', customTranslations)}
              </Button>
            </span>
          )}
        </Badge>
      </div>

      {handleMinimizeToTray && (
        <Button
          id="minimize-tray-shortcut"
          variant="outline"
          size="xs"
          onClick={handleMinimizeToTray}
          className="flex items-center shrink-0 justify-center gap-1.5 transition-all cursor-pointer font-mono font-semibold bg-card hover:bg-muted text-foreground border-border"
          title={translate(locale, 'engine', 'MinimizeToTray', customTranslations)}
        >
          <Minimize2 className="w-3 h-3 text-orange-400" />
          <span className="hidden sm:inline">{translate(locale, 'engine', 'MinimizeToTray', customTranslations)}</span>
        </Button>
      )}
    </motion.div>
  );
}
