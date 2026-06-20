import React from 'react';
import { Database, Trash2, Plus } from 'lucide-react';
import CollapsibleCard from '../../shared/CollapsibleCard';
import { useOxyFlow } from '../../../hooks/useOxyFlow';
import { translate } from '../../../utils/i18n';
import { DataManager } from '../../../utils/dataManager';

export default function PatchLogsTable() {
  const { 
    projects, 
    patches, setPatches, 
    locale, customTranslations, resolvedTheme 
  } = useOxyFlow();

  const themeClasses = resolvedTheme === 'light' 
    ? { wrapper: 'bg-white border-slate-200 shadow-slate-100', tableHeader: 'border-slate-200 text-slate-500 bg-slate-100/50' }
    : resolvedTheme === 'high-contrast'
    ? { wrapper: 'bg-black border-white border-2', tableHeader: 'border-white text-white' }
    : { wrapper: 'bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', tableHeader: 'border-white/10 text-slate-400 bg-black/30' };

  return (
    <CollapsibleCard
      title={`patch_logs table (${patches?.length || 0} ${translate(locale, 'dynamic.records', customTranslations)})`}
      icon={Database}
      iconColor="text-emerald-400"
      titleColor="text-emerald-400"
      defaultExpanded={true}
      wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 text-left"
      headerRight={
        <button
          onClick={() => {
            const start = prompt("Podaj czas startowy (YYYY-MM-DDTHH:mm:ss.sssZ):", new Date().toISOString());
            const end = prompt("Podaj czas końcowy (YYYY-MM-DDTHH:mm:ss.sssZ):", new Date(Date.now() + 3600000).toISOString());
            const note = prompt("Powód łatki (patchNote):", "Korekta po uśpieniu systemu");
            if (start && end && projects.length > 0) {
              setPatches(prev => [...prev, {
                id: DataManager.getNextId(patches || [], 'patch_'),
                projectId: projects[0].id,
                startTime: start,
                endTime: end,
                patchNote: note || 'Korekta manualna'
              }]);
            }
          }}
          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
        >
          <Plus className="w-3.5 h-3.5" />
          {translate(locale, 'dynamic.addManualPatch', customTranslations)}
        </button>
      }
    >
      <p className="text-[11px] text-slate-400 mb-4 mt-0.5">{translate(locale, 'dynamic.patchTableAllows', customTranslations)}</p>
      
      <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs font-mono text-left whitespace-nowrap">
          <thead>
            <tr className={`border-b ${themeClasses.tableHeader} uppercase text-[10px] tracking-wide`}>
              <th className="py-3 px-4 rounded-l-xl">id</th>
              <th className="py-3 px-4">project_id</th>
              <th className="py-3 px-4">task_id (opt)</th>
              <th className="py-3 px-4">start_time</th>
              <th className="py-3 px-4">end_time</th>
              <th className="py-3 px-4">patch_note / reason</th>
              <th className="py-3 px-4 rounded-r-xl text-right">actions</th>
            </tr>
          </thead>
          <tbody className="dark:text-white">
            {(patches || []).map(p => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3.5 px-4 font-bold text-emerald-400">{p.id}</td>
                <td className="py-3.5 px-4">{p.projectId}</td>
                <td className="py-3.5 px-4 text-slate-400">{p.taskId || 'NULL'}</td>
                <td className="py-3.5 px-4 border-l border-white/5">{new Date(p.startTime).toLocaleString()}</td>
                <td className="py-3.5 px-4">{new Date(p.endTime).toLocaleString()}</td>
                <td className="py-3.5 px-4 italic text-slate-400">{p.patchNote} {p.isSystemEvent && <span className="text-emerald-500 font-bold ml-1">[SYSTEM]</span>}</td>
                <td className="py-3.5 px-4 text-right">
                  <button onClick={() => {
                    if (confirm('Usunąć tę łatkę z bazy?')) {
                      setPatches(curr => curr.filter(x => x.id !== p.id));
                    }
                  }} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {(patches || []).length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500 italic">{translate(locale, 'dynamic.noPatchesOperatingStandard', customTranslations)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  );
}
