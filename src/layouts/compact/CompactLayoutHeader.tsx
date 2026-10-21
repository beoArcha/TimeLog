import { Clock, Maximize2, X } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { LayoutVariant } from '@bindings/LayoutVariant';
import versionsData from '@app/versions.json';
import { Locale } from '@bindings/Locale';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { MonoText } from '@components/ui/typography';
import { Label } from '@components/ui/label';

interface CompactLayoutHeaderProps {
  locale: Locale;
  customTranslations: Record<string, unknown>;
  alwaysOnTopSmall: boolean;
  lastNonCompactVariant: Exclude<LayoutVariant, 'compact'> | undefined;
  setAlwaysOnTopSmall: (value: boolean) => void;
  showToast: (msg: string) => void;
  onRestoreWindow: () => void;
  onMinimizeToTray: () => void;
}

export function CompactLayoutHeader({
  locale,
  customTranslations,
  alwaysOnTopSmall,
  setAlwaysOnTopSmall,
  showToast,
  onRestoreWindow,
  onMinimizeToTray,
}: CompactLayoutHeaderProps) {
  const onTopToastMessage = (checked: boolean) =>
    checked
      ? translate(locale, 'timer', 'AlwaysOnTopOn', customTranslations)
      : translate(locale, 'timer', 'AlwaysOnTopOff', customTranslations);

  const restoreTitle =
    translate(locale, 'app', 'MaximizeRestore', customTranslations);
  const trayTitle =
    translate(locale, 'app', 'CloseToTray', customTranslations);

  return (
    <div className="flex items-center justify-between border-b pb-2 border-border select-none">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 border border-orange-500/30">
          <Clock className="w-3 h-3 text-orange-400 animate-pulse" />
        </div>
        <MonoText
          data-testid="compact-header-title"
          className="font-sans font-bold tracking-tight text-foreground"
        >
          LogTime by OxyFlow v{versionsData.major}.{versionsData.minor}.{versionsData.release}
        </MonoText>
      </div>

      <div className="flex items-center gap-1.5">
        <Label className="flex items-center gap-1 font-mono text-xs mr-1 text-muted-foreground hover:text-orange-400 cursor-pointer select-none">
          <Checkbox
            id="compact-always-on-top-checkbox"
            data-testid="compact-always-on-top-checkbox"
            checked={alwaysOnTopSmall}
            onCheckedChange={(checked) => {
              const isChecked = Boolean(checked);
              setAlwaysOnTopSmall(isChecked);
              showToast(onTopToastMessage(isChecked));
            }}
            className="w-3.5 h-3.5 rounded select-none border-border data-checked:bg-orange-500 data-checked:border-orange-500"
          />
          <span>Top</span>
        </Label>

        <Button
          id="compact-restore-btn"
          data-testid="compact-restore-btn"
          variant="ghost"
          size="icon-xs"
          onClick={onRestoreWindow}
          className="p-1 rounded hover:bg-muted hover:text-foreground text-muted-foreground cursor-pointer transition-colors"
          title={restoreTitle}
          aria-label={restoreTitle}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>

        <Button
          id="compact-close-btn"
          data-testid="compact-close-btn"
          variant="ghost"
          size="icon-xs"
          onClick={onMinimizeToTray}
          className="p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-muted-foreground cursor-pointer transition-colors"
          title={trayTitle}
          aria-label={trayTitle}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
