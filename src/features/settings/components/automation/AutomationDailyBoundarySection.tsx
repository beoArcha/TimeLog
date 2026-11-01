import React from 'react';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { TimeInput } from '@components/ui/time-input';
import { Caption } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';

export interface AutomationDailyBoundarySectionProps {
  enabled: boolean;
  boundaryTime: string;
  onChange: (patch: { autoStopDailyBoundaryEnabled?: boolean; autoStopDailyBoundaryTime?: string }) => void;
}

export const AutomationDailyBoundarySection: React.FC<AutomationDailyBoundarySectionProps> = ({
  enabled,
  boundaryTime,
  onChange,
}) => {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-card">
      <Label className="flex items-center gap-2 cursor-pointer font-normal">
        <Checkbox
          data-testid="workflow-daily-boundary-checkbox"
          checked={enabled}
          onCheckedChange={(checked) => onChange({ autoStopDailyBoundaryEnabled: !!checked })}
        />
        <span className="text-xs font-semibold text-foreground">
          {translate(locale, 'settings', 'AutoStopDailyBoundary', customTranslations)}
        </span>
      </Label>
      <Caption variant="muted" className="pl-6">
        {translate(locale, 'settings', 'AutoStopDailyBoundaryDesc', customTranslations)}
      </Caption>
      {enabled && (
        <div className="flex items-center gap-3 pl-6 pt-2">
          <Label htmlFor="workflow-boundary-time-input" className="text-xs text-muted-foreground whitespace-nowrap">
            {translate(locale, 'settings', 'TimeLabel', customTranslations)}:
          </Label>
          <TimeInput
            id="workflow-boundary-time-input"
            data-testid="workflow-boundary-time-input"
            value={boundaryTime}
            onChange={(e) => onChange({ autoStopDailyBoundaryTime: e.target.value })}
            className="w-32 h-8"
          />
        </div>
      )}
    </div>
  );
};
