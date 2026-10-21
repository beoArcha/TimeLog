import React, { useRef } from 'react';
import { UploadCloud, DownloadCloud, Database } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { Button } from '@components/ui/button';
import { Caption } from '@components/ui/typography';
import { Input } from '@components/ui/input';
import { HStack } from '@components/ui/stack';
import { translate } from '@common/i18n/translator';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { validateBackupPayload } from '@common/utils/backupValidator';
import { exportDatabaseAsJson } from '@common/utils/databaseExport';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { useData } from '@common/hooks/DataContext';
import { useLocale } from '@common/hooks/LocaleProvider';

export function DatabaseBackupCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useWindowShell();
  const { locale, customTranslations } = useLocale();
  const { projects, tasks, logs, holidays, patches, handleRestoreState } = useData();

  const handleExportDatabase = () => {
    exportDatabaseAsJson({ projects, tasks, logs, holidays, patches });
  };

  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const data = validateBackupPayload(parsed);

        if (handleRestoreState) {
          await handleRestoreState(data);
        }

        showToast?.(translate(locale, 'settings', 'RestoreSuccess', customTranslations));
      } catch (err) {
        ErrorHandler.handle(new PersistenceException('Failed to restore backup from file', err, 'ERR_BACKUP_RESTORE'));
        showToast?.(translate(locale, 'settings', 'InvalidBackup', customTranslations));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <CollapsibleCard
      title={translate(locale, 'settings', 'BackupCardTitle', customTranslations)}
      icon={Database}
      iconColor="text-orange-500"
      defaultExpanded={true}
    >
      <Caption variant="muted">
        {translate(locale, 'settings', 'BackupDesc', customTranslations)}
      </Caption>
      <HStack gap="md" className="mt-2">
        <Button
          onClick={handleExportDatabase}
          data-testid="export-backup-btn"
          variant="default"
          size="sm"
          className="w-fit flex items-center gap-2 mt-2 h-auto"
        >
          <UploadCloud className="w-4 h-4" />
          {translate(locale, 'settings', 'BackupJson', customTranslations)}
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          data-testid="import-backup-btn"
          variant="secondary"
          size="sm"
          className="w-fit flex items-center gap-2 mt-2 h-auto"
        >
          <DownloadCloud className="w-4 h-4" />
          {translate(locale, 'settings', 'RestoreImportJson', customTranslations)}
        </Button>
        <Input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleImportDatabase}
          className="hidden"
          data-testid="import-backup-input"
        />
      </HStack>
    </CollapsibleCard>
  );
}

export default DatabaseBackupCard;
