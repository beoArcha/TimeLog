import React from 'react';
import { ListTodo, BarChart3, Settings } from 'lucide-react';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';

export type MediumTabType = 'tasks' | 'reports' | 'settings';

export interface MediumTabBarProps {
  currentTab: MediumTabType;
  onSelectTab: (tab: MediumTabType) => void;
  theme?: string;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export default function MediumTabBar({
  currentTab,
  onSelectTab,
  theme,
  locale = 'en',
  customTranslations,
}: MediumTabBarProps) {
  return (
    <nav
      id="medium-bottom-nav"
      className={`shrink-0 mt-2 p-1.5 border-t rounded-2xl grid grid-cols-3 gap-2 z-30 transition-all ${
        theme === 'light'
          ? 'bg-[#FCFAF8]/95 border-[#DFD7CB] backdrop-blur-md text-[#2C2421]'
          : theme === 'high-contrast'
            ? 'bg-black border-2 border-white text-white'
            : 'bg-slate-900/95 border-white/10 backdrop-blur-md text-white'
      }`}
    >
      <button
        type="button"
        data-testid="medium-tab-tasks"
        onClick={() => onSelectTab('tasks')}
        className={`flex-1 min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'tasks'
            ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[11px] tracking-tight">
          {translate(locale, 'app', 'TabMain', customTranslations) || 'Zadania'}
        </span>
      </button>

      <button
        type="button"
        data-testid="medium-tab-reports"
        onClick={() => onSelectTab('reports')}
        className={`flex-1 min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'reports'
            ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[11px] tracking-tight">
          {translate(locale, 'report', 'TabReports', customTranslations) || 'Raporty'}
        </span>
      </button>

      <button
        type="button"
        data-testid="medium-tab-settings"
        onClick={() => onSelectTab('settings')}
        className={`flex-1 min-h-[48px] py-1.5 px-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'settings'
            ? 'text-orange-500 font-bold bg-orange-500/10 shadow-xs'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[11px] tracking-tight">
          {translate(locale, 'settings', 'TabOptions', customTranslations) || 'Ustawienia'}
        </span>
      </button>
    </nav>
  );
}
