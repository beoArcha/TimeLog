import React from 'react';
import { Shield } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import versionsData from '@app/versions.json';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';

export const AppLogo: React.FC = () => {
  const { dragRegionProps } = usePlatformCapabilities();
  const { locale, customTranslations } = useLocale();
  const { layoutVariant } = useSettings();

  return (
    <div {...dragRegionProps} className="flex items-center gap-2 sm:gap-2.5 shrink-0">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-orange-400 to-rose-500 shadow-md flex items-center justify-center text-white shrink-0">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <div>
        <h1 className="font-sans font-bold text-sm sm:text-base tracking-tight leading-none flex items-center text-foreground">
          <span>OxyFlow</span>
          <span className="text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-1.5 py-0.2 rounded ml-1.5 font-bold font-mono">
            v{versionsData.subversions.front}
          </span>
        </h1>
        {layoutVariant === 'full' && (
          <p className="hidden sm:block text-[10px] font-sans mt-0.5 text-muted-foreground">
            {translate(locale, 'app', 'Subtitle', customTranslations)}
          </p>
        )}
      </div>
    </div>
  );
};
