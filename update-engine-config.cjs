import fs from 'fs';

let text = fs.readFileSync('src/components/EngineConfig.tsx', 'utf8');

text = text.replace(/import \{ Cpu, Settings, Copy, Check, ChevronDown, ChevronRight \} from 'lucide-react';/, "import { Cpu, Settings, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';\nimport CollapsibleCard from './CollapsibleCard';");

let replaced = text.replace(/return \([\s\S]*?\);\n\}/, `return (
    <CollapsibleCard 
      title="Konfiguracja Silnika (Engine Settings)" 
      icon={Cpu} 
      iconColor="text-emerald-500"
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-4">
        <p className={\`text-xs leading-relaxed \${resolvedTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}\`}>Skonfiguruj zachowanie silnika OxyFlow w tle, wysyłanie logów, autostart oraz wybudzenia.</p>
        
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input 
              type="checkbox" 
              checked={sysSettings?.autoStart}
              onChange={(e) => updateSetting('autoStart', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className={\`text-xs font-semibold \${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}\`}>
              Uruchamiaj aplikację na start komputera (AutoStart)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input 
              type="checkbox" 
              checked={sysSettings?.autoPauseOnSleep}
              onChange={(e) => updateSetting('autoPauseOnSleep', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className={\`text-xs font-semibold \${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}\`}>
              Automatyczne wstrzymanie po przejściu w uśpienie i wznowienie (rejestr w tabeli patch_logs)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input 
              type="checkbox" 
              checked={sysSettings?.includePatchesInReports}
              onChange={(e) => updateSetting('includePatchesInReports', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className={\`text-xs font-semibold \${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}\`}>
              Uwzględnij ręczne korekty/czas z patch_logs w raportach czasu pracy
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit mt-2 border-t border-slate-200 dark:border-white/5 pt-4">
            <input 
              type="checkbox" 
              checked={minimizeToTray}
              onChange={(e) => setMinimizeToTray(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className={\`text-xs font-semibold \${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}\`}>
              Domyślnie minimalizuj do Tray (System Tray Daemon) zamiast zamykać GUI
            </span>
          </label>
        </div>
      </div>
    </CollapsibleCard>
  );
}`);

fs.writeFileSync('src/components/EngineConfig.tsx', replaced);
