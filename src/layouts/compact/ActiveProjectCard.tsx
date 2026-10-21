import { Project } from '@bindings/Project';
import { translate } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';
import { TranslationDictionary } from '@common/i18n/types';
import { Overline, Heading } from '@components/ui/typography';

interface ActiveProjectCardProps {
  activeProj: Project;
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function ActiveProjectCard({
  activeProj,
  locale,
  customTranslations,
}: ActiveProjectCardProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex items-center gap-2 truncate">
        <span
          className={`w-3 h-3 rounded-full bg-${activeProj.color || 'rose'}-500 shrink-0 shadow-sm`}
        />
        <div className="text-left">
          <Overline as="p" className="font-mono leading-none">
            {translate(locale, 'timer', 'AppProfile', customTranslations)}
          </Overline>
          <Heading
            level={4}
            className="text-xs font-bold font-sans mt-0.5 truncate max-w-[220px] text-foreground"
            title={activeProj.name}
          >
            {activeProj.name}
          </Heading>
        </div>
      </div>
    </div>
  );
}
