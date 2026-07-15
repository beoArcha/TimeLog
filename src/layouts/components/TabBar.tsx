import React from 'react';
import { Clock, BarChart, Database, Settings, UploadCloud, Terminal, BookOpen, Sparkles } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { Theme } from '@common/types/ThemeTypes';
import { Locale } from '@/src/bindings/Locale';

interface TabBarProps {
  locale: Locale;
  customTranslations: any;
  resolvedTheme: Theme;
  activeLargeTab: string;
  setActiveLargeTab: (tab: any) => void;
}

export default function TabBar({
  locale,
  customTranslations,
  resolvedTheme,
  activeLargeTab,
  setActiveLargeTab,
}: TabBarProps) {
  const tabs = [
    { id: 'main', icon: Clock, iconColor: 'text-orange-400', label: translate(locale, 'app', 'TabMain', customTranslations) },
    { id: 'reports', icon: BarChart, iconColor: 'text-teal-400', label: translate(locale, 'report', 'TabReports', customTranslations) },
    { id: 'db', icon: Database, iconColor: 'text-indigo-400', label: translate(locale, 'database', 'TabDb', customTranslations) },
    { id: 'options', icon: Settings, iconColor: 'text-yellow-400', label: translate(locale, 'settings', 'TabOptions', customTranslations) },
    { id: 'backup', icon: UploadCloud, iconColor: 'text-emerald-400', label: translate(locale, 'settings', 'TabBackup', customTranslations) },
    { id: 'cli', icon: Terminal, iconColor: 'text-[#9B8C83]', label: translate(locale, 'cli', 'TabCli', customTranslations) },
    { id: 'manual', icon: BookOpen, iconColor: 'text-rose-400', label: translate(locale, 'help', 'TabManual', customTranslations) },
    { id: 'credits', icon: Sparkles, iconColor: 'text-sky-400', label: translate(locale, 'help', 'TabCredits', customTranslations) }
  ];

  return (
    <div className={`border-b transition-all duration-300 ${resolvedTheme === 'light' ? 'bg-[#EAE4DB]/50 border-[#DFD7CB]' : 'bg-black/35 border-white/5'
      }`}>
      <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
        <div role="tablist" aria-label="Navigation tabs" className="flex gap-1.5 py-2.5 whitespace-nowrap min-w-max">
          {tabs.map(tb => {
            const isActive = activeLargeTab === tb.id;
            return (
              <button
                key={tb.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveLargeTab(tb.id)}
                data-testid={`tab-${tb.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer capitalize ${isActive
                  ? resolvedTheme === 'light'
                    ? 'bg-[#FCFAF8] text-[#2C2421] border border-[#DFD7CB] shadow font-extrabold'
                    : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-extrabold'
                  : resolvedTheme === 'light'
                    ? 'text-[#8A7A71] hover:text-[#2C2421] hover:bg-[#F4EFEA]'
                    : 'text-[#9B8C83] hover:text-white hover:bg-[#FCFAF8]/5'
                  }`}
              >
                <tb.icon className={`w-4 h-4 ${tb.iconColor} ${isActive ? 'animate-pulse' : ''}`} />
                <span>{tb.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
