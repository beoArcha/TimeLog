import React, { useState } from 'react';
import { Cpu, Settings, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useOxyFlow } from '../hooks/useOxyFlow';
import CollapsibleCard from './CollapsibleCard';
import { translate } from '../utils/i18n';

export default function EngineConfig() {
  const { minimizeToTray, setMinimizeToTray, resolvedTheme, sysSettings, setSysSettings, locale, customTranslations } = useOxyFlow();
  const [isExpanded, setIsExpanded] = useState(true);

  const updateSetting = (key: keyof typeof sysSettings, value: boolean) => {
    setSysSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <CollapsibleCard 
      title={translate(locale, 'engine.configTitle', customTranslations)} 
      icon={Cpu} 
      iconColor="text-emerald-500"
      defaultExpanded={false}
    >
      <div className="flex flex-col gap-4">
        <p className={`text-xs leading-relaxed ${resolvedTheme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>{translate(locale, 'engine.configDesc', customTranslations)}</p>
        
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input 
              type="checkbox" 
              checked={sysSettings?.autoStart}
              onChange={(e) => updateSetting('autoStart', e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-300'}`}>
              {translate(locale, 'engine.autoStart', customTranslations)}
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
              {translate(locale, 'engine.autoPauseOnSleep', customTranslations)}
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
              {translate(locale, 'engine.includePatchesInReports', customTranslations)}
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
              {translate(locale, 'engine.minimizeToTrayDefault', customTranslations)}
            </span>
          </label>
        </div>
      </div>
    </CollapsibleCard>
  );
}

