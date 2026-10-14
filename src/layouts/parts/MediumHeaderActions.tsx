import React, { useContext } from 'react';
import { Plus, PanelLeft, PanelRight } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { LocaleContext } from '@common/hooks/LocaleProvider';
import { Locale } from '@bindings/Locale';
import { TranslationDictionary } from '@common/i18n/types';

export interface MediumHeaderActionsProps {
  theme?: string;
  dockPosition: 'right' | 'left';
  onToggleDock: () => void;
  onOpenCreateProject: () => void;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export const MediumHeaderActions: React.FC<MediumHeaderActionsProps> = ({
  theme,
  dockPosition,
  onToggleDock,
  onOpenCreateProject,
  locale: propLocale,
  customTranslations: propCustomTranslations,
}) => {
  const context = useContext(LocaleContext);
  const activeLocale = propLocale ?? context?.locale ?? 'en';
  const activeCustomTranslations = propCustomTranslations ?? context?.customTranslations;

  const newProjectLabel =
    translate(activeLocale, 'project', 'NewProject', activeCustomTranslations) || 'New Project';

  const dockSwitchTitle =
    dockPosition === 'right'
      ? translate(activeLocale, 'app', 'DockSwitchToLeft', activeCustomTranslations) ||
        'Switch dock to the left side'
      : translate(activeLocale, 'app', 'DockSwitchToRight', activeCustomTranslations) ||
        'Switch dock to the right side';

  const dockAriaLabel =
    translate(activeLocale, 'app', 'DockSwitchPosition', activeCustomTranslations) ||
    'Switch dock side';

  const toolbarLabel =
    translate(activeLocale, 'common', 'Actions', activeCustomTranslations) || 'Actions';

  return (
    <div
      role="toolbar"
      aria-label={toolbarLabel}
      className="flex items-center gap-1.5 shrink-0"
    >
      <button
        type="button"
        onClick={onOpenCreateProject}
        className={`p-2 rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 ${
          theme === 'light'
            ? 'bg-white border-[#DFD7CB] text-orange-600 hover:bg-orange-50'
            : 'bg-white/10 border-white/10 text-orange-400 hover:bg-white/20'
        }`}
        title={newProjectLabel}
        aria-label={newProjectLabel}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onToggleDock}
        aria-pressed={dockPosition === 'left'}
        className={`hidden lg:flex p-2 rounded-xl border transition-all cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 ${
          theme === 'light'
            ? 'bg-white border-[#DFD7CB] text-slate-700 hover:bg-slate-100'
            : 'bg-white/10 border-white/10 text-slate-300 hover:bg-white/20'
        }`}
        title={dockSwitchTitle}
        aria-label={dockAriaLabel}
      >
        {dockPosition === 'right' ? (
          <PanelLeft className="w-4 h-4" aria-hidden="true" />
        ) : (
          <PanelRight className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};
