import { Cpu } from 'lucide-react';
import { useOxyFlow } from '@common/hooks/OxyContext';
import CollapsibleCard from './CollapsibleCard';
import { translate } from '@common/i18n/translator';

export default function EngineConfig() {
  const { minimizeToTray, setMinimizeToTray, alwaysOnTopSmall, setAlwaysOnTopSmall, alwaysOnTopMain, setAlwaysOnTopMain, resolvedTheme, sysSettings, setSysSettings, locale, customTranslations } = useOxyFlow();

  const updateSetting = (key: keyof typeof sysSettings, value: boolean) => {
    setSysSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <CollapsibleCard
      title={translate(locale, 'engine', 'ConfigTitle', customTranslations)}
      icon={Cpu}
      iconColor="text-emerald-500"
      defaultExpanded={false}
      headerTestId="collapsible-trigger-Konfiguracja Silnika"
    >
      <div className="flex flex-col gap-4">
        <p className={`text-xs leading-relaxed ${resolvedTheme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>{translate(locale, 'engine', 'ConfigDesc', customTranslations)}</p>

        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={sysSettings?.autoStart}
              onChange={(e) => updateSetting('autoStart', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-300'}`}>
              {translate(locale, 'engine', 'AutoStart', customTranslations)}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={sysSettings?.autoPauseOnSleep}
              onChange={(e) => updateSetting('autoPauseOnSleep', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-300'}`}>
              {translate(locale, 'engine', 'AutoPauseOnSleep', customTranslations)}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={sysSettings?.includePatchesInReports}
              onChange={(e) => updateSetting('includePatchesInReports', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-300'}`}>
              {translate(locale, 'engine', 'IncludePatchesInReports', customTranslations)}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit mt-2 border-t border-[#DFD7CB] dark:border-white/5 pt-4">
            <input
              type="checkbox"
              checked={minimizeToTray}
              onChange={(e) => setMinimizeToTray(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-300'}`}>
              {translate(locale, 'engine', 'MinimizeToTrayDefault', customTranslations)}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={alwaysOnTopSmall}
              onChange={(e) => setAlwaysOnTopSmall(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-300'}`}>
              {translate(locale, 'engine', 'AlwaysOnTopSmall', customTranslations) || 'Zawsze na wierzchu (Mały widok)'}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={alwaysOnTopMain}
              onChange={(e) => setAlwaysOnTopMain(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-300'}`}>
              {translate(locale, 'engine', 'AlwaysOnTopMain', customTranslations) || 'Zawsze na wierzchu (Średni i Duży widok)'}
            </span>
          </label>
        </div>
      </div>
    </CollapsibleCard>
  );
}

