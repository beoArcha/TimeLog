import React from 'react';
import { Cpu } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
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
          <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
            <Checkbox
              checked={sysSettings?.autoStart}
              onCheckedChange={(checked) => updateSetting('autoStart', !!checked)}
            />
            <span className="text-xs font-semibold text-foreground">
              {translate(locale, 'engine', 'AutoStart', customTranslations)}
            </span>
          </Label>

          <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
            <Checkbox
              checked={sysSettings?.includePatchesInReports}
              onCheckedChange={(checked) => updateSetting('includePatchesInReports', !!checked)}
            />
            <span className="text-xs font-semibold text-foreground">
              {translate(locale, 'engine', 'IncludePatchesInReports', customTranslations)}
            </span>
          </Label>

          <Label className="flex items-center gap-2 cursor-pointer w-fit mt-2 border-t border-border pt-4 font-normal">
            <Checkbox
              checked={minimizeToTray}
              onCheckedChange={(checked) => setMinimizeToTray(!!checked)}
            />
            <span className="text-xs font-semibold text-foreground">
              {translate(locale, 'engine', 'MinimizeToTrayDefault', customTranslations)}
            </span>
          </Label>

          <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
            <Checkbox
              checked={alwaysOnTopSmall}
              onCheckedChange={(checked) => setAlwaysOnTopSmall(!!checked)}
            />
            <span className="text-xs font-semibold text-foreground">
              {translate(locale, 'engine', 'AlwaysOnTopSmall', customTranslations)}
            </span>
          </Label>

          <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
            <Checkbox
              checked={alwaysOnTopMain}
              onCheckedChange={(checked) => setAlwaysOnTopMain(!!checked)}
            />
            <span className="text-xs font-semibold text-foreground">
              {translate(locale, 'engine', 'AlwaysOnTopMain', customTranslations)}
            </span>
          </Label>
        </div>
      </div>
    </CollapsibleCard>
  );
}
