import React from 'react';
import { Shield } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import versionsData from '../../../versions.json';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';

export const AppLogo: React.FC = () => {
  const { dragRegionProps } = usePlatformCapabilities();
  const { locale, customTranslations } = useLocale();
  const { resolvedTheme } = useSettings();;

  return (
    <div {...dragRegionProps} className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-400 to-rose-500 shadow-lg flex items-center justify-center text-white transform hover:rotate-3 transition-transform">
        <Shield className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className={`font-sans font-bold text-base tracking-tight leading-none ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'
          }`}>
          OxyFlow Client
          <span className="text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded ml-2 font-bold font-mono">
            <v>{versionsData.subversions.front}</v>
          </span>
        </h1>
        <p className={`text-[10px] font-sans mt-0.5 ${resolvedTheme === 'light' ? 'text-[#8A7A71]' : 'text-[#9B8C83]'
          }`}>
          {translate(locale, 'app', 'Subtitle', customTranslations)}
        </p>
      </div>
    </div>
  );
};
