import React from 'react';
import { Clock, BarChart, Database, Settings, UploadCloud, Terminal, BookOpen, Sparkles } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';
import { Button } from '@components/ui/button';

interface TabBarProps {
  locale: Locale;
  customTranslations: any;
  resolvedTheme?: string;
  activeLargeTab: string;
  setActiveLargeTab: (tab: any) => void;
}

export default function TabBar({
  locale,
  customTranslations,
  activeLargeTab,
  setActiveLargeTab,
}: TabBarProps) {
  const tabs = [
    { id: 'main', icon: Clock, iconColor: 'text-orange-400', label: translate(locale, 'app', 'TabMain', customTranslations) },
    { id: 'reports', icon: BarChart, iconColor: 'text-teal-400', label: translate(locale, 'report', 'TabReports', customTranslations) },
    { id: 'db', icon: Database, iconColor: 'text-indigo-400', label: translate(locale, 'database', 'TabDb', customTranslations) },
    { id: 'options', icon: Settings, iconColor: 'text-yellow-400', label: translate(locale, 'settings', 'TabOptions', customTranslations) },
    { id: 'backup', icon: UploadCloud, iconColor: 'text-emerald-400', label: translate(locale, 'settings', 'TabBackup', customTranslations) },
    { id: 'cli', icon: Terminal, iconColor: 'text-muted-foreground', label: translate(locale, 'cli', 'TabCli', customTranslations) },
    { id: 'manual', icon: BookOpen, iconColor: 'text-rose-400', label: translate(locale, 'help', 'TabManual', customTranslations) },
    { id: 'credits', icon: Sparkles, iconColor: 'text-sky-400', label: translate(locale, 'help', 'TabCredits', customTranslations) }
  ];

  return (
    <div className="shrink-0 z-20 border-b border-border bg-muted/30 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
        <div role="tablist" aria-label="Navigation tabs" className="flex gap-1.5 py-2.5 whitespace-nowrap min-w-max">
          {tabs.map(tb => {
            const isActive = activeLargeTab === tb.id;
            return (
              <Button
                key={tb.id}
                role="tab"
                variant="ghost"
                aria-selected={isActive}
                onClick={() => setActiveLargeTab(tb.id)}
                data-testid={`tab-${tb.id}`}
                className={`flex items-center gap-2 px-4 py-2 h-auto rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer capitalize ${
                  isActive
                    ? 'bg-card text-foreground border border-border shadow-xs font-extrabold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <tb.icon className={`w-4 h-4 ${tb.iconColor} ${isActive ? 'animate-pulse' : ''}`} />
                <span>{tb.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
