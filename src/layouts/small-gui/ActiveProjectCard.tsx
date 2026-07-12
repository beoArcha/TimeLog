import { Project } from '@bindings/Project';
import { translate } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';

interface ActiveProjectCardProps {
  activeProj: Project;
  resolvedTheme: string | undefined;
  locale: Locale;
  customTranslations: any;
}

export function ActiveProjectCard({
  activeProj,
  resolvedTheme,
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
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">
            {translate(locale, 'timer', 'AppProfile', customTranslations)}
          </p>
          <h4
            className={`text-xs font-bold font-sans mt-0.5 truncate max-w-[220px] ${resolvedTheme === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}
            title={activeProj.name}
          >
            {activeProj.name}
          </h4>
        </div>
      </div>
    </div>
  );
}
