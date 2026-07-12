import { Clock, Maximize2, X } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { GuiSize } from '@bindings/GuiSize';
import versionsData from '../../versions.json';
import { Locale } from '@/src/bindings/Locale';

interface SmallGuiHeaderProps {
  locale: Locale;
  customTranslations: any;
  alwaysOnTopSmall: boolean;
  lastNonSmallVariant: Exclude<GuiSize, 'small'> | undefined;
  setAlwaysOnTopSmall: (value: boolean) => void;
  showToast: (msg: string) => void;
  onRestoreWindow: () => void;
  onMinimizeToTray: () => void;
}

export function SmallGuiHeader({
  locale,
  customTranslations,
  alwaysOnTopSmall,
  setAlwaysOnTopSmall,
  showToast,
  onRestoreWindow,
  onMinimizeToTray,
}: SmallGuiHeaderProps) {
  const onTopToastMessage = (checked: boolean) =>
    checked
      ? translate(locale, 'timer', 'AlwaysOnTopOn', customTranslations)
      : translate(locale, 'timer', 'AlwaysOnTopOff', customTranslations);

  const restoreTitle =
    locale === 'pl' ? 'Przywróć większy rozmiar' : 'Restore larger size';
  const trayTitle =
    locale === 'pl' ? 'Zamknij / Ukryj do Tray' : 'Close / Hide to Tray';

  return (
    <div className="flex items-center justify-between border-b pb-2 border-white/10 select-none">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-450 border border-orange-505/30">
          <Clock className="w-3 h-3 text-orange-400 animate-pulse" />
        </div>
        <span className="font-sans font-bold text-[10px] tracking-tight">
          LogTime by OxyFlow v{versionsData.major}.{versionsData.minor}.{versionsData.release}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="flex items-center gap-0.5 font-mono text-[10px] mr-1 text-slate-400 hover:text-orange-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={alwaysOnTopSmall}
            onChange={(e) => {
              setAlwaysOnTopSmall(e.target.checked);
              showToast(onTopToastMessage(e.target.checked));
            }}
            className="w-3 h-3 rounded select-none accent-orange-500 cursor-pointer"
          />
          <span>Top</span>
        </label>

        <button
          onClick={onRestoreWindow}
          className="p-1 rounded hover:bg-white/10 hover:text-orange-400 text-slate-400 cursor-pointer transition-colors flex items-center justify-center"
          title={restoreTitle}
          aria-label={restoreTitle}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onMinimizeToTray}
          className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 cursor-pointer transition-colors flex items-center justify-center"
          title={trayTitle}
          aria-label={trayTitle}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
