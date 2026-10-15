import React from 'react';
import { ListTodo, BarChart3, Settings } from 'lucide-react';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';
import { Button } from '@components/ui/button';

export type MediumTabType = 'tasks' | 'reports' | 'settings';

export interface MediumTabBarProps {
  currentTab: MediumTabType;
  onSelectTab: (tab: MediumTabType) => void;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export default function MediumTabBar({
  currentTab,
  onSelectTab,
  locale = 'en',
  customTranslations,
}: MediumTabBarProps) {
  return (
    <nav
      id="medium-bottom-nav"
      className="shrink-0 mt-2 p-1.5 border-t border-border rounded-2xl grid grid-cols-3 gap-2 z-30 transition-all bg-card/95 backdrop-blur-md text-foreground"
    >
      <Button
        type="button"
        variant="ghost"
        data-testid="medium-tab-tasks"
        onClick={() => onSelectTab('tasks')}
        className={`flex-1 h-auto min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'tasks'
            ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[11px] tracking-tight">
          {translate(locale, 'app', 'TabMain', customTranslations)}
        </span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        data-testid="medium-tab-reports"
        onClick={() => onSelectTab('reports')}
        className={`flex-1 h-auto min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'reports'
            ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[11px] tracking-tight">
          {translate(locale, 'report', 'TabReports', customTranslations)}
        </span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        data-testid="medium-tab-settings"
        onClick={() => onSelectTab('settings')}
        className={`flex-1 h-auto min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'settings'
            ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[11px] tracking-tight">
          {translate(locale, 'settings', 'TabOptions', customTranslations)}
        </span>
      </Button>
    </nav>
  );
}
