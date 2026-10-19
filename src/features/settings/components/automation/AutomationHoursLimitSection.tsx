import React from 'react';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { Input } from '@components/ui/input';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';

export interface AutomationHoursLimitSectionProps {
  enabled: boolean;
  hoursLimit: number;
  onChange: (patch: { autoStopHoursLimitEnabled?: boolean; autoStopHoursLimit?: number }) => void;
}

export const AutomationHoursLimitSection: React.FC<AutomationHoursLimitSectionProps> = ({
  enabled,
  hoursLimit,
  onChange,
}) => {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-card">
      <Label className="flex items-center gap-2 cursor-pointer font-normal">
        <Checkbox
          data-testid="workflow-hours-limit-checkbox"
          checked={enabled}
          onCheckedChange={(checked) => onChange({ autoStopHoursLimitEnabled: !!checked })}
        />
        <span className="text-xs font-semibold text-foreground">
          {translate(locale, 'settings', 'AutoStopHoursLimit', customTranslations)}
        </span>
      </Label>
      <p className="text-xs text-muted-foreground pl-6">
        {translate(locale, 'settings', 'AutoStopHoursLimitDesc', customTranslations)}
      </p>
      {enabled && (
        <div className="flex items-center gap-3 pl-6 pt-2">
          <Label htmlFor="workflow-hours-input" className="text-xs text-muted-foreground whitespace-nowrap">
            {translate(locale, 'settings', 'HoursLabel', customTranslations)}:
          </Label>
          <Input
            id="workflow-hours-input"
            data-testid="workflow-hours-input"
            type="number"
            min={1}
            max={24}
            value={hoursLimit}
            onChange={(e) => onChange({ autoStopHoursLimit: Math.max(1, Number(e.target.value) || 1) })}
            className="w-24 h-8"
          />
        </div>
      )}
    </div>
  );
};
