import React from 'react';
import { UploadCloud } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { Badge } from '@components/ui/badge';
import { Heading, Caption } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { useLocale } from '@common/hooks/LocaleProvider';
import { DatabaseBackupCard } from './components/DatabaseBackupCard';
import { ApiSyncSettings } from './components/ApiSyncSettings';

export default function BackupTab() {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="backdrop-blur-md rounded-[2.5rem] p-8 border border-border bg-card text-card-foreground shadow-2xl flex flex-col gap-6 transition-all duration-300">
      <div>
        <Badge variant="orange" size="sm" className="font-mono tracking-wider uppercase">
          {translate(locale, 'settings', 'TabBackup', customTranslations)}
        </Badge>
        <Heading level={2} className="font-sans font-bold text-2xl mt-1.5 text-foreground">
          <HStack gap="sm">
            <UploadCloud className="w-6 h-6 text-emerald-400" />
            <span>{translate(locale, 'settings', 'TabBackup', customTranslations)}</span>
          </HStack>
        </Heading>
        <Caption variant="muted" className="mt-2">
          {translate(locale, 'settings', 'BackupTabSubtitle', customTranslations)}
        </Caption>
      </div>

      <DatabaseBackupCard />
      <ApiSyncSettings />
    </div>
  );
}
