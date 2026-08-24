import { ChevronDown } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';

interface TaskVisibilityToggleProps {
  isExpanded: boolean;
  resolvedTheme: string | undefined;
  locale: Locale;
  customTranslations: any;
  onToggle: () => void;
}

export function TaskVisibilityToggle({
  isExpanded,
  resolvedTheme,
  locale,
  customTranslations,
  onToggle,
}: TaskVisibilityToggleProps) {
  const label = isExpanded
    ? translate(locale, 'timer', 'HideTasks', customTranslations)
    : translate(locale, 'timer', 'ShowTasks', customTranslations);

  return (
    <div className="pt-1 text-center">
      <button
        data-testid="compact-toggle-tasks-btn"
        onClick={onToggle}
        className={`w-full py-1 rounded-xl transition-all font-mono text-[9px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${resolvedTheme === 'light'
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            : 'bg-white/5 hover:bg-white/10 text-slate-300'
          }`}
      >
        <span>{label}</span>
        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center">
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-300 text-orange-400 ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </div>
      </button>
    </div>
  );
}
