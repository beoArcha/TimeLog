import React, { useContext } from 'react';
import { Plus, PanelLeft, PanelRight } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { LocaleContext } from '@common/hooks/LocaleProvider';
import { Locale } from '@bindings/Locale';
import { TranslationDictionary } from '@common/i18n/types';
import { Button } from '@components/ui/button';

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
    translate(activeLocale, 'project', 'NewProject', activeCustomTranslations);

  const dockSwitchTitle =
    dockPosition === 'right'
      ? translate(activeLocale, 'app', 'DockSwitchToLeft', activeCustomTranslations)
      : translate(activeLocale, 'app', 'DockSwitchToRight', activeCustomTranslations);

  const dockAriaLabel =
    translate(activeLocale, 'app', 'DockSwitchPosition', activeCustomTranslations);

  const toolbarLabel =
    translate(activeLocale, 'common', 'Actions', activeCustomTranslations);

  return (
    <div
      role="toolbar"
      aria-label={toolbarLabel}
      className="flex items-center gap-1.5 shrink-0"
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onOpenCreateProject}
        className={`rounded-xl transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-background border-border text-orange-600 hover:bg-orange-50'
            : 'bg-white/10 border-white/10 text-orange-400 hover:bg-white/20'
        }`}
        title={newProjectLabel}
        aria-label={newProjectLabel}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onToggleDock}
        aria-pressed={dockPosition === 'left'}
        className={`hidden lg:flex rounded-xl transition-all cursor-pointer items-center justify-center ${
          theme === 'light'
            ? 'bg-background border-border text-foreground hover:bg-muted'
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
      </Button>
    </div>
  );
};
