import React from 'react';
import { Cpu } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';

/**
 * Settings panel for engine and system daemon options.
 */
export default function EngineConfig() {
  const { locale, customTranslations } = useLocale();
  const {
    minimizeToTray,
    setMinimizeToTray,
    alwaysOnTopSmall,
    setAlwaysOnTopSmall,
    alwaysOnTopMain,
    setAlwaysOnTopMain,
    sysSettings,
    setSysSettings,
  } = useSettings();

  const updateSetting = (key: keyof typeof sysSettings, value: boolean) => {
    setSysSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <CollapsibleCard
      title={translate(locale, 'engine', 'ConfigTitle', customTranslations)}
      icon={Cpu}
      iconColor="text-emerald-500"
      defaultExpanded={false}
      headerTestId="collapsible-trigger-engine-settings"
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {translate(locale, 'engine', 'ConfigDesc', customTranslations)}
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={sysSettings?.autoStart}
              onChange={(e) => updateSetting('autoStart', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="text-xs font-semibold text-foreground">
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
            <span className="text-xs font-semibold text-foreground">
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
            <span className="text-xs font-semibold text-foreground">
              {translate(locale, 'engine', 'IncludePatchesInReports', customTranslations)}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit mt-2 border-t border-border pt-4">
            <input
              type="checkbox"
              checked={minimizeToTray}
              onChange={(e) => setMinimizeToTray(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-xs font-semibold text-foreground">
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
            <span className="text-xs font-semibold text-foreground">
              {translate(locale, 'engine', 'AlwaysOnTopSmall', customTranslations) || 'Always on top (Compact view)'}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={alwaysOnTopMain}
              onChange={(e) => setAlwaysOnTopMain(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-xs font-semibold text-foreground">
              {translate(locale, 'engine', 'AlwaysOnTopMain', customTranslations) || 'Always on top (Standard and Expanded view)'}
            </span>
          </label>
        </div>
      </div>
    </CollapsibleCard>
  );
}
