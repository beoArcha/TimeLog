import React from 'react';
import { Settings, RefreshCw, AlertTriangle, CalendarDays, Info } from 'lucide-react';
import { useOxyFlow } from '@core/providers/OxyContext';
import EngineConfig from '@common/components/EngineConfig';
import HolidaysAndLeaves from '@common/components/HolidaysAndLeaves';
import { translate } from '@core/i18n/i18n';
import { toast } from 'sonner';
import CollapsibleCard from '@common/components/CollapsibleCard';
import versionsData from '../../versions.json';

export default function SettingsTab() {
  const { customTranslations, resolvedTheme, locale, setProjects, setTasks, setLogs } = useOxyFlow();

  const handleResetData = () => {
    const response = window.prompt(translate(locale, 'dynamic.warningResetApp', customTranslations));
    if (response === 'reset') {
      setProjects([]);
      setTasks([]);
      setLogs([]);
      localStorage.removeItem('oxytime_state_db_6');
      toast.success(translate(locale, 'settings.resetSuccess', customTranslations));
    } else if (response !== null) {
      toast.error(translate(locale, 'settings.resetCancel', customTranslations));
    }
  };

  return (
    <div className="text-left flex flex-col gap-6 max-h-[85vh] overflow-y-auto pr-1">
      <div className={`border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${resolvedTheme === 'light' ? 'border-[#DFD7CB]' : 'border-white/5'}`}>
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
            <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
            <span>{translate(locale, 'settings.title', customTranslations)}</span>
          </h2>
          <p className={`text-xs ${resolvedTheme === 'light' ? 'text-[#5A4A42]' : 'text-slate-300'}`}>{translate(locale, 'settings.description', customTranslations)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <EngineConfig />

        <div className="mt-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-orange-400" /> {translate(locale, 'settings.holidaysTitle', customTranslations)}</h3>
          <HolidaysAndLeaves />
        </div>

        <CollapsibleCard
          title={translate(locale, 'settings.destructiveZone', customTranslations)}
          icon={AlertTriangle}
          iconColor="text-rose-500"
          titleColor="text-rose-500"
          defaultExpanded={false}
          wrapperClassName="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 flex flex-col gap-4"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
            <p className={`text-xs max-w-sm ${resolvedTheme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>{translate(locale, 'settings.hardResetDesc', customTranslations)}</p>
            <button
              onClick={handleResetData}
              className="bg-rose-500 hover:bg-rose-600 px-6 py-3 rounded-2xl text-white text-xs font-bold uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" /> {translate(locale, 'settings.hardResetBtn', customTranslations)}
            </button>
          </div>
        </CollapsibleCard>

        {/* Application Version Details */}
        <CollapsibleCard
          title="OxyFlow Versions"
          icon={Info}
          iconColor="text-blue-500"
          titleColor="text-blue-500"
          defaultExpanded={false}
          wrapperClassName={`p-6 rounded-3xl border ${resolvedTheme === 'light' ? 'border-[#DFD7CB] bg-white' : 'border-white/5 bg-white/5'} flex flex-col gap-4`}
        >
          <div className="flex flex-col gap-3 mt-2 text-sm">
            <div className={`flex justify-between items-center pb-2 border-b ${resolvedTheme === 'light' ? 'border-[#DFD7CB]' : 'border-white/5'}`}>
              <span className="font-medium">App Release</span>
              <span className="font-bold font-mono text-blue-500">v{versionsData.major}.{versionsData.minor}.{versionsData.release}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs mt-2">
              <div className={`p-3 rounded-xl border ${resolvedTheme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB]' : 'bg-black/20 border-white/5'}`}>
                <div className="opacity-70 mb-1">Engine</div>
                <div className="font-bold font-mono">v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.engine}</div>
              </div>
              <div className={`p-3 rounded-xl border ${resolvedTheme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB]' : 'bg-black/20 border-white/5'}`}>
                <div className="opacity-70 mb-1">Front</div>
                <div className="font-bold font-mono">v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.front}</div>
              </div>
              <div className={`p-3 rounded-xl border ${resolvedTheme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB]' : 'bg-black/20 border-white/5'}`}>
                <div className="opacity-70 mb-1">Components</div>
                <div className="font-bold font-mono">v{versionsData.major}.{versionsData.minor}.{versionsData.subversions.components}</div>
              </div>
              <div className={`p-3 rounded-xl border ${resolvedTheme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB]' : 'bg-black/20 border-white/5'}`}>
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
