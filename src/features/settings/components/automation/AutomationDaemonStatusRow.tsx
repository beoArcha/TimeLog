import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';

export interface AutomationDaemonStatusRowProps {
  isDaemonRunning: boolean;
  isChecking: boolean;
  onCheckRules: () => Promise<void>;
}

export const AutomationDaemonStatusRow: React.FC<AutomationDaemonStatusRowProps> = ({
  isDaemonRunning,
  isChecking,
  onCheckRules,
}) => {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <Badge
          variant={isDaemonRunning ? 'outline' : 'secondary'}
          className="text-xs font-semibold"
        >
          {isDaemonRunning
            ? translate(locale, 'settings', 'DaemonStatusRunning', customTranslations)
            : translate(locale, 'settings', 'DaemonStatusIdle', customTranslations)}
        </Badge>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onCheckRules}
        disabled={isChecking}
        data-testid="workflow-check-now-btn"
        className="flex items-center gap-1.5 text-xs font-medium"
      >
        <Clock className="w-3.5 h-3.5" />
        <span>{translate(locale, 'settings', 'CheckRulesNow', customTranslations)}</span>
      </Button>
    </div>
  );
};
