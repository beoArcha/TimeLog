import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { WorkflowRouter } from '@common/workflows/WorkflowRouter';
import { WorkflowConfig, WorkflowStatus, DEFAULT_WORKFLOW_CONFIG } from '@common/workflows/IWorkflow';
import { toast } from 'sonner';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { WorkflowException } from '@common/exceptions/AppExceptions';
import { AutomationDaemonStatusRow } from './automation/AutomationDaemonStatusRow';
import { AutomationHoursLimitSection } from './automation/AutomationHoursLimitSection';
import { AutomationDailyBoundarySection } from './automation/AutomationDailyBoundarySection';
import { AutomationTaskCompleteSection } from './automation/AutomationTaskCompleteSection';
import { AutomationWarningSection } from './automation/AutomationWarningSection';

export default function AutomationSettings() {
  const { locale, customTranslations } = useLocale();
  const [config, setConfig] = useState<WorkflowConfig>(DEFAULT_WORKFLOW_CONFIG);
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const loadedConfig = await WorkflowRouter.getInstance().getConfig();
        const loadedStatus = await WorkflowRouter.getInstance().getStatus();
        if (mounted) {
          setConfig(loadedConfig);
          setStatus(loadedStatus);
        }
      } catch (err) {
        ErrorHandler.handle(new WorkflowException('Failed loading workflow configuration in settings', err));
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const updateConfig = async (patch: Partial<WorkflowConfig>) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    try {
      await WorkflowRouter.getInstance().saveConfig(updated);
    } catch (err) {
      ErrorHandler.handle(new WorkflowException('Failed saving workflow configuration', err));
      toast.error(translate(locale, 'common', 'ErrGeneric', customTranslations));
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await WorkflowRouter.getInstance().checkRules();
      const updatedStatus = await WorkflowRouter.getInstance().getStatus();
      setStatus(updatedStatus);
      if (res.stopped) {
        toast.warning(`${translate(locale, 'settings', 'AutoStopTriggered', customTranslations)}: ${res.reason || ''}`);
      } else if (res.warning) {
        toast.info(translate(locale, 'settings', 'WarningLimitApproaching', customTranslations));
      } else {
        toast.success(translate(locale, 'common', 'ErrSuccess', customTranslations));
      }
    } catch (err) {
      ErrorHandler.handle(new WorkflowException('Manual rule check execution failed in AutomationSettings', err));
      toast.error(translate(locale, 'common', 'ErrGeneric', customTranslations));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <CollapsibleCard
      title={translate(locale, 'settings', 'AutomationTitle', customTranslations)}
      icon={Zap}
      iconColor="text-indigo-500"
      defaultExpanded={false}
      headerTestId="collapsible-trigger-automation-settings"
    >
      <div className="flex flex-col gap-5 text-sm">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {translate(locale, 'settings', 'AutomationDesc', customTranslations)}
        </p>

        <AutomationDaemonStatusRow
          isDaemonRunning={!!status?.isDaemonRunning}
          isChecking={isChecking}
          onCheckRules={handleManualCheck}
        />

        <AutomationHoursLimitSection
          enabled={config.autoStopHoursLimitEnabled}
          hoursLimit={config.autoStopHoursLimit}
          onChange={updateConfig}
        />

        <AutomationDailyBoundarySection
          enabled={config.autoStopDailyBoundaryEnabled}
          boundaryTime={config.autoStopDailyBoundaryTime}
          onChange={updateConfig}
        />

        <AutomationTaskCompleteSection
          enabled={config.autoStopOnTaskComplete}
          onChange={(autoStopOnTaskComplete) => updateConfig({ autoStopOnTaskComplete })}
        />

        <AutomationWarningSection
          enabled={config.warningNotificationEnabled}
          onChange={(warningNotificationEnabled) => updateConfig({ warningNotificationEnabled })}
        />
      </div>
    </CollapsibleCard>
  );
}
