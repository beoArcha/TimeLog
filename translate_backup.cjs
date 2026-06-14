const fs = require('fs');
let text = fs.readFileSync('src/components/BackupTab.tsx', 'utf8');

text = text.replace("import { useOxyFlow } from '../hooks/useOxyFlow';", "import { useOxyFlow } from '../hooks/useOxyFlow';\nimport { translate } from '../utils/i18n';");

text = text.replace(
"const { resolvedTheme, logToApi, setLogToApi, apiToken, setApiToken, apiUrl, setApiUrl, projects, tasks, logs, holidays, patches } = useOxyFlow();",
"const { resolvedTheme, logToApi, setLogToApi, apiToken, setApiToken, apiUrl, setApiUrl, apiMethod, setApiMethod, apiHeaders, setApiHeaders, projects, tasks, logs, holidays, patches, locale, customTranslations } = useOxyFlow();"
);

text = text.replace(/<span className="text-\[10px\] font-mono tracking-wider bg-orange-500\/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500\/25">[\s\S]*?<\/span>/, 
`<span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-300 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
          {translate(locale, 'tabs.backup', customTranslations)}
        </span>`);

text = text.replace(/Kopie i Wysyłanie logów \(Backup\)/, "{translate(locale, 'tabs.backup', customTranslations)}");

text = text.replace(/Zarządzaj eksportem plików oraz konfiguracją zdalnego zapisu logów produkcyjnych silnika\./, 
"{translate(locale, 'settings.sendLogsToApi', customTranslations)}"); // A bit of reuse

text = text.replace(/title="Eksport i kopia JSON \(Zrzut do pliku\)"/, 'title="JSON / SQLite Backup"');

text = text.replace(/Eksportuj Pełen Backup \(Format JSON\)/, 'Backup JSON / Format JSON');

text = text.replace(/title="Eksport zewnętrzny przez API \(Live Log Push\)"/, 'title={translate(locale, "settings.sendLogsToApi", customTranslations)}');

text = text.replace(/Wysyłaj logi do zewnętrznego API \(Zamiast tylko do bazy danych lokalnie\)/, '{translate(locale, "settings.sendLogsToApi", customTranslations)}');

text = text.replace(
/<div className="text-\[10px\] text-indigo-500 font-mono font-bold mt-2 flex items-center gap-1.5">[\s\S]*?<\/div>/,
`<div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className={\`text-xs w-20 font-mono font-bold \${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}\`}>{translate(locale, 'settings.apiMethod', customTranslations)}</label>
              <select 
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value as 'POST' | 'PUT')}
                className={\`flex-1 rounded-xl text-xs p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all \${
                  resolvedTheme === 'light' ? 'bg-white border border-[#DFD7CB] text-[#2C2421]' : 'bg-slate-900 border border-white/10 text-white shadow-inner'
                }\`}
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <label className={\`text-xs font-mono font-bold \${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}\`}>{translate(locale, 'settings.apiHeaders', customTranslations)}</label>
              <p className="text-[10px] text-slate-400">{translate(locale, 'settings.apiHeadersDesc', customTranslations)}</p>
              <textarea 
                value={apiHeaders}
                onChange={(e) => setApiHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                rows={4}
                className={\`w-full rounded-xl text-xs p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all \${
                  resolvedTheme === 'light' ? 'bg-white border border-[#DFD7CB] text-[#2C2421]' : 'bg-slate-900 border border-white/10 text-white shadow-inner'
                }\`}
              />
            </div>

            <div className="text-[10px] text-indigo-500 font-mono font-bold mt-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> {translate(locale, 'common.success', customTranslations)}!
            </div>`
);


fs.writeFileSync('src/components/BackupTab.tsx', text);
