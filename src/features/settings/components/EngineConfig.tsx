import React from 'react';
import { Cpu } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { Caption } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

/**
 * Settings panel for engine and system daemon options.
 */
export default function EngineConfig() {
  const { locale, customTranslations } = useLocale();
  const { supportsTray, supportsAlwaysOnTop, supportsAutoStart } = usePlatformCapabilities();
  const {
    minimizeToTray,
    setMinimizeToTray,
    alwaysOnTopSmall,
    setAlwaysOnTopSmall,
    alwaysOnTopMain,
    setAlwaysOnTopMain,
    sysSettings,
    setSysSettings,
    defaultProjectConcurrency,
    setDefaultProjectConcurrency,
  } = useSettings();

  const updateSetting = (key: keyof typeof sysSettings, value: boolean) => {
    setSysSettings((prev) => ({ ...prev, [key]: value }));
  };

  const hasDesktopOptions = supportsTray || supportsAlwaysOnTop || supportsAutoStart;

  return (
    <CollapsibleCard
      title={translate(locale, 'engine', 'ConfigTitle', customTranslations)}
      icon={Cpu}
      iconColor="text-emerald-500"
      defaultExpanded={false}
      headerTestId="collapsible-trigger-engine-settings"
    >
      <div className="flex flex-col gap-4">
        <Caption variant="muted" className="leading-relaxed">
          {translate(locale, 'engine', 'ConfigDesc', customTranslations)}
        </Caption>

        <div className="flex flex-col gap-4">
          {supportsAutoStart && (
            <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
              <Checkbox
                checked={sysSettings?.autoStart}
                onCheckedChange={(checked) => updateSetting('autoStart', !!checked)}
              />
              <Caption as="span" size="xs">
                {translate(locale, 'engine', 'AutoStart', customTranslations)}
              </Caption>
            </Label>
          )}

          <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
            <Checkbox
              checked={sysSettings?.includePatchesInReports}
              onCheckedChange={(checked) => updateSetting('includePatchesInReports', !!checked)}
            />
            <Caption as="span" size="xs">
              {translate(locale, 'engine', 'IncludePatchesInReports', customTranslations)}
            </Caption>
          </Label>

          <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
            <Checkbox
              checked={defaultProjectConcurrency}
              onCheckedChange={(checked) => setDefaultProjectConcurrency(!!checked)}
            />
            <Caption as="span" size="xs">
              {translate(locale, 'project', 'AllowConcurrencyDefault', customTranslations)}
            </Caption>
          </Label>

          {hasDesktopOptions && (
            <div className="flex flex-col gap-4 mt-2 border-t border-border pt-4">
              {supportsTray && (
                <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
                  <Checkbox
                    checked={minimizeToTray}
                    onCheckedChange={(checked) => setMinimizeToTray(!!checked)}
                  />
                  <Caption as="span" size="xs">
                    {translate(locale, 'engine', 'MinimizeToTrayDefault', customTranslations)}
                  </Caption>
                </Label>
              )}

              {supportsAlwaysOnTop && (
                <>
                  <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
                    <Checkbox
                      checked={alwaysOnTopSmall}
                      onCheckedChange={(checked) => setAlwaysOnTopSmall(!!checked)}
                    />
                    <Caption as="span" size="xs">
                      {translate(locale, 'engine', 'AlwaysOnTopSmall', customTranslations)}
                    </Caption>
                  </Label>

                  <Label className="flex items-center gap-2 cursor-pointer w-fit font-normal">
                    <Checkbox
                      checked={alwaysOnTopMain}
                      onCheckedChange={(checked) => setAlwaysOnTopMain(!!checked)}
                    />
                    <Caption as="span" size="xs">
                      {translate(locale, 'engine', 'AlwaysOnTopMain', customTranslations)}
                    </Caption>
                  </Label>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </CollapsibleCard>
  );
}
