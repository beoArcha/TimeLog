import React from 'react';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';

export interface AutomationWarningSectionProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const AutomationWarningSection: React.FC<AutomationWarningSectionProps> = ({
  enabled,
  onChange,
}) => {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-card">
      <Label className="flex items-center gap-2 cursor-pointer font-normal">
        <Checkbox
          data-testid="workflow-warning-checkbox"
          checked={enabled}
          onCheckedChange={(checked) => onChange(!!checked)}
        />
        <span className="text-xs font-semibold text-foreground">
          {translate(locale, 'settings', 'WarningNotification', customTranslations)}
        </span>
      </Label>
      <p className="text-xs text-muted-foreground pl-6">
        {translate(locale, 'settings', 'WarningNotificationDesc', customTranslations)}
      </p>
    </div>
  );
};
