import React, { useState } from 'react';
import { Settings, RefreshCw, AlertTriangle, CalendarDays, Info } from 'lucide-react';
import EngineConfig from './components/EngineConfig';
import HolidaysLeavesView from '@features/holidays/HolidaysLeavesView';
import { translate } from '@common/i18n/translator';
import { toast } from 'sonner';
import CollapsibleCard from '@components/CollapsibleCard';
import PromptDialog from '@components/PromptDialog';
import { Button } from '@components/ui/button';
import versionsData from '@app/versions.json';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';

export default function SettingsTab() {
  const { customTranslations, locale } = useLocale();
  const { setProjects, setTasks, setLogs } = useData();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleConfirmReset = (response: string) => {
    setIsResetModalOpen(false);
    if (response === 'reset') {
      setProjects([]);
      setTasks([]);
      setLogs([]);
      localStorage.removeItem('oxytime_state_db_6');
      toast.success(translate(locale, 'engine', 'ResetSuccess', customTranslations));
    } else {
      toast.error(translate(locale, 'engine', 'ResetCancel', customTranslations));
    }
  };

  return (
    <div className="text-left flex flex-col gap-6 max-h-[85vh] overflow-y-auto pr-1">
      <PromptDialog
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        title={translate(locale, 'engine', 'DestructiveZone', customTranslations)}
        description={translate(locale, 'cli', 'WarningResetApp', customTranslations)}
        confirmLabel={translate(locale, 'common', 'Confirm', customTranslations)}
        cancelLabel={translate(locale, 'common', 'Cancel', customTranslations)}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
      <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
            <span>{translate(locale, 'settings', 'Title', customTranslations)}</span>
          </h2>
          <p className="text-xs text-muted-foreground">{translate(locale, 'settings', 'Description', customTranslations)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <EngineConfig />

        <div className="mt-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-orange-400" /> {translate(locale, 'settings', 'HolidaysTitle', customTranslations)}</h3>
          <HolidaysLeavesView />
        </div>

        <CollapsibleCard
          title={translate(locale, 'engine', 'DestructiveZone', customTranslations)}
          icon={AlertTriangle}
          iconColor="text-rose-500"
          titleColor="text-rose-500"
          defaultExpanded={false}
          wrapperClassName="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 flex flex-col gap-4"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
            <p className="text-xs max-w-sm text-muted-foreground">{translate(locale, 'engine', 'HardResetDesc', customTranslations)}</p>
            <Button
              variant="destructive"
              onClick={() => setIsResetModalOpen(true)}
              className="bg-rose-500 hover:bg-rose-600 px-6 py-3 rounded-2xl text-white text-xs font-bold uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap h-auto"
            >
              <RefreshCw className="w-4 h-4" /> {translate(locale, 'engine', 'HardResetBtn', customTranslations)}
            </Button>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="OxyFlow Versions"
          icon={Info}
          iconColor="text-blue-500"
          titleColor="text-blue-500"
          defaultExpanded={false}
          wrapperClassName="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3 mt-2 text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="font-medium">App Release</span>
              <span className="font-bold font-mono text-blue-500">v{versionsData.major}.{versionsData.minor}.{versionsData.release}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs mt-2">
              <div className="p-3 rounded-xl border bg-muted/30 border-border">
                <div className="opacity-70 mb-1">Engine</div>
                <div className="font-bold font-mono">v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.engine}</div>
              </div>
              <div className="p-3 rounded-xl border bg-muted/30 border-border">
                <div className="opacity-70 mb-1">Front</div>
                <div className="font-bold font-mono">v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.front}</div>
              </div>
              <div className="p-3 rounded-xl border bg-muted/30 border-border">
                <div className="opacity-70 mb-1">Components</div>
                <div className="font-bold font-mono">v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.components}</div>
              </div>
              <div className="p-3 rounded-xl border bg-muted/30 border-border">
                <div className="opacity-70 mb-1">Translations</div>
                <div className="font-bold font-mono">v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.translations}</div>
              </div>
            </div>
          </div>
        </CollapsibleCard>

      </div>
    </div>
  );
}
