import React, { useRef } from 'react';
import { UploadCloud, DownloadCloud, CheckCircle, Database } from 'lucide-react';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { translate } from '@common/i18n/i18n';
import CollapsibleCard from '@components/common/CollapsibleCard';
import { BackupKey } from '@/src/common/i18n/keys/BackupKey';
import { DynamicKey } from '@/src/common/i18n/keys/DynamicKey';
import { SettingsKey } from '@/src/common/i18n/keys/SettingsKey';
import { TabKey } from '@/src/common/i18n/keys/TabKey';

export default function BackupTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme, logToApi, setLogToApi, apiToken, setApiToken, apiUrl, setApiUrl, apiMethod, setApiMethod, apiHeaders, setApiHeaders, projects, setProjects, tasks, setTasks, logs, setLogs, holidays, setHolidays, patches, setPatches, locale, customTranslations } = useOxyFlow();

  const handleExportDatabase = () => {
    const data = { projects, tasks, logs, holidays, patches };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OxyFlow_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (data.projects) setProjects(data.projects);
        if (data.tasks) setTasks(data.tasks);
        if (data.logs) setLogs(data.logs);
        if (data.holidays) setHolidays(data.holidays);
        if (data.patches) setPatches(data.patches);
        alert(translate(locale, BackupKey.RestoreSuccess, customTranslations));
      } catch (_) {
        alert(translate(locale, BackupKey.InvalidBackup, customTranslations));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className={`backdrop-blur-md rounded-[2.5rem] p-8 border shadow-2xl flex flex-col gap-6 transition-all duration-300 ${resolvedTheme === 'light'
      ? 'bg-white border-slate-200 shadow-slate-100'
      : resolvedTheme === 'high-contrast'
        ? 'bg-black border-2 border-white'
        : 'bg-white/5 border-white/10'
      }`}>
      <div>
        <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
          {translate(locale, TabKey.Backup, customTranslations)}
        </span>
        <h2 className={`font-sans font-bold text-2xl mt-1.5 flex items-center gap-2 ${resolvedTheme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
          <UploadCloud className="w-6 h-6 text-emerald-400" />
          {translate(locale, TabKey.Backup, customTranslations)}
        </h2>
        <p className={`text-xs mt-2 ${resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          {translate(locale, SettingsKey.SendLogsToApi, customTranslations)}
        </p>
      </div>

      <CollapsibleCard
        title="JSON / SQLite Backup"
        icon={Database}
        iconColor="text-orange-500"
        defaultExpanded={true}
      >
        <p className={`text-xs ${resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          {translate(locale, DynamicKey.BackupDesc, customTranslations)}
        </p>
        <div className="flex gap-4 mt-2">
          <button
            onClick={handleExportDatabase}
            data-testid="export-backup-btn"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm px-5 py-3 w-fit flex items-center gap-2 transition-all mt-2"
          >
            <UploadCloud className="w-4 h-4" />
            {translate(locale, BackupKey.BackupJson, customTranslations)}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            data-testid="import-backup-btn"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm px-5 py-3 w-fit flex items-center gap-2 transition-all mt-2"
          >
            <DownloadCloud className="w-4 h-4" />
            {translate(locale, BackupKey.RestoreImportJson, customTranslations)}
          </button>
          <input
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
        title={translate(locale, SettingsKey.SendLogsToApi, customTranslations)}
        icon={UploadCloud}
        iconColor="text-indigo-500"
        defaultExpanded={false}
        headerTestId="api-push-collapse-header"
      >
        <p className={`text-xs ${resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
          {translate(locale, DynamicKey.WebhookDesc, customTranslations)}
        </p>

        <label className="flex items-center gap-2 cursor-pointer w-fit mt-2">
          <input
            type="checkbox"
            checked={logToApi}
            onChange={(e) => setLogToApi(e.target.checked)}
            className="w-4 h-4 accent-amber-500"
            data-testid="api-push-toggle"
          />
          <span className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
            {translate(locale, SettingsKey.SendLogsToApi, customTranslations)}
          </span>
        </label>

        {logToApi && (
          <div className="flex flex-col gap-3 mt-4 pl-6 border-l-2 border-indigo-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className={`text-xs w-20 font-mono font-bold ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{translate(locale, DynamicKey.ApiAddress, customTranslations)}</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                data-testid="api-url-input"
                placeholder="https://moj-serwer.pl/api/oxyflow-logs"
                className={`flex-1 rounded-xl text-xs p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${resolvedTheme === 'light' ? 'bg-white border border-[#DFD7CB] text-[#2C2421]' : 'bg-slate-900 border border-white/10 text-white shadow-inner'
                  }`}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className={`text-xs w-20 font-mono font-bold ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{translate(locale, DynamicKey.BearerAuthTitle, customTranslations)}</label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                data-testid="api-token-input"
                placeholder="eyJh..."
                className={`flex-1 rounded-xl text-xs p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${resolvedTheme === 'light' ? 'bg-white border border-[#DFD7CB] text-[#2C2421]' : 'bg-slate-900 border border-white/10 text-white shadow-inner'
                  }`}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className={`text-xs w-20 font-mono font-bold ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{translate(locale, SettingsKey.ApiMethod, customTranslations)}</label>
              <select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value as 'POST' | 'PUT')}
                className={`flex-1 rounded-xl text-xs p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${resolvedTheme === 'light' ? 'bg-white border border-[#DFD7CB] text-[#2C2421]' : 'bg-slate-900 border border-white/10 text-white shadow-inner'
                  }`}
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className={`text-xs font-mono font-bold ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{translate(locale, SettingsKey.ApiHeaders, customTranslations)}</label>
              <p className="text-[10px] text-slate-400">{translate(locale, SettingsKey.ApiHeadersDesc, customTranslations)}</p>
              <textarea
                value={apiHeaders}
                onChange={(e) => setApiHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                rows={4}
                className={`w-full rounded-xl text-xs p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${resolvedTheme === 'light' ? 'bg-white border border-[#DFD7CB] text-[#2C2421]' : 'bg-slate-900 border border-white/10 text-white shadow-inner'
                  }`}
              />
            </div>

            <div className="text-[10px] text-indigo-500 font-mono font-bold mt-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> {translate(locale, 'common.success', customTranslations)}!
            </div>
          </div>
        )}
      </CollapsibleCard>

    </div>
  );
}
