import React, { useRef } from 'react';
import { UploadCloud, DownloadCloud, CheckCircle, Database } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import CollapsibleCard from '@components/CollapsibleCard';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { NativeSelect } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { validateBackupPayload } from '@common/utils/backupValidator';
import { exportDatabaseAsJson } from '@common/utils/databaseExport';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useData } from '@common/hooks/DataContext';

export default function BackupTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { locale, customTranslations } = useLocale();
  const { logToApi, setLogToApi, apiToken, setApiToken, apiUrl, setApiUrl, apiMethod, setApiMethod, apiHeaders, setApiHeaders } = useSettings();
  const { projects, tasks, logs, holidays, patches, handleRestoreState } = useData();
  const { showToast } = useWindowShell();

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
    <div className="backdrop-blur-md rounded-[2.5rem] p-8 border border-border bg-card text-card-foreground shadow-2xl flex flex-col gap-6 transition-all duration-300">
      <div>
        <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
          {translate(locale, 'settings', 'TabBackup', customTranslations)}
        </span>
        <h2 className="font-sans font-bold text-2xl mt-1.5 flex items-center gap-2 text-foreground">
          <UploadCloud className="w-6 h-6 text-emerald-400" />
          {translate(locale, 'settings', 'TabBackup', customTranslations)}
        </h2>
        <p className="text-xs mt-2 text-muted-foreground">
          {translate(locale, 'settings', 'SendLogsToApi', customTranslations)}
        </p>
      </div>

      <CollapsibleCard
        title="JSON / SQLite Backup"
        icon={Database}
        iconColor="text-orange-500"
        defaultExpanded={true}
      >
        <p className="text-xs text-muted-foreground">
          {translate(locale, 'settings', 'BackupDesc', customTranslations)}
        </p>
        <div className="flex gap-4 mt-2">
          <Button
            onClick={handleExportDatabase}
            data-testid="export-backup-btn"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm px-5 py-3 w-fit flex items-center gap-2 transition-all mt-2 h-auto"
          >
            <UploadCloud className="w-4 h-4" />
            {translate(locale, 'settings', 'BackupJson', customTranslations)}
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            data-testid="import-backup-btn"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm px-5 py-3 w-fit flex items-center gap-2 transition-all mt-2 h-auto"
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
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title={translate(locale, 'settings', 'SendLogsToApi', customTranslations)}
        icon={UploadCloud}
        iconColor="text-indigo-500"
        defaultExpanded={false}
        headerTestId="api-push-collapse-header"
      >
        <p className="text-xs text-muted-foreground">
          {translate(locale, 'settings', 'WebhookDesc', customTranslations)}
        </p>

        <Label className="flex items-center gap-2 cursor-pointer w-fit mt-2 font-normal">
          <Checkbox
            checked={logToApi}
            onCheckedChange={(checked) => setLogToApi(!!checked)}
            data-testid="api-push-toggle"
          />
          <span className="text-xs font-semibold text-foreground">
            {translate(locale, 'settings', 'SendLogsToApi', customTranslations)}
          </span>
        </Label>

        {logToApi && (
          <div className="flex flex-col gap-3 mt-4 pl-6 border-l-2 border-indigo-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label className="text-xs w-20 font-mono font-bold text-foreground">{translate(locale, 'settings', 'ApiAddress', customTranslations)}</Label>
              <Input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                data-testid="api-url-input"
                placeholder="https://moj-serwer.pl/api/oxyflow-logs"
                className="flex-1 rounded-xl text-xs p-3 font-mono transition-all bg-card border-border text-foreground"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label className="text-xs w-20 font-mono font-bold text-foreground">{translate(locale, 'settings', 'BearerAuthTitle', customTranslations)}</Label>
              <Input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                data-testid="api-token-input"
                placeholder="eyJh..."
                className="flex-1 rounded-xl text-xs p-3 font-mono transition-all bg-card border-border text-foreground"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label className="text-xs w-20 font-mono font-bold text-foreground">{translate(locale, 'settings', 'ApiMethod', customTranslations)}</Label>
              <NativeSelect
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value as 'POST' | 'PUT')}
                className="flex-1 rounded-xl text-xs p-3 font-mono transition-all bg-card border-border text-foreground"
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </NativeSelect>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <Label className="text-xs font-mono font-bold text-foreground">{translate(locale, 'settings', 'ApiHeaders', customTranslations)}</Label>
              <p className="text-[10px] text-slate-400">{translate(locale, 'settings', 'ApiHeadersDesc', customTranslations)}</p>
              <Textarea
                value={apiHeaders}
                onChange={(e) => setApiHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                rows={4}
                className="w-full rounded-xl text-xs p-3 font-mono transition-all bg-card border-border text-foreground"
              />
            </div>

            <div className="text-[10px] text-indigo-500 font-mono font-bold mt-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> {translate(locale, 'common', 'ErrSuccess', customTranslations)}!
            </div>
          </div>
        )}
      </CollapsibleCard>

    </div>
  );
}
