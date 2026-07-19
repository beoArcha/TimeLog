import React, { useState } from 'react';
import { Database, Trash2, Plus, X } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { translate } from '@common/i18n/translator';
import { LocalStorageDataManager as DataManager } from '@/src/plugins/persistence/DataManager';
import { motion, AnimatePresence } from 'motion/react';

export default function PatchLogsTable() {
  const {
    projects,
    patches, setPatches,
    locale, customTranslations, resolvedTheme
  } = useOxyFlow();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [patchNote, setPatchNote] = useState('');

  const handleOpenModal = () => {
    setStartTime(new Date().toISOString());
    setEndTime(new Date(Date.now() + 3600000).toISOString());
    setPatchNote('Korekta po uśpieniu systemu');
    setIsModalOpen(true);
  };

  const handleAddPatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime && endTime && projects.length > 0) {
      setPatches(prev => [...prev, {
        id: DataManager.getNextId(patches || [], 'patch_'),
        projectId: projects[0].id,
        startTime,
        endTime,
        patchNote: patchNote || 'Korekta manualna'
      }]);
      setIsModalOpen(false);
    }
  };

  const themeClasses = resolvedTheme === 'light'
    ? { wrapper: 'bg-white border-slate-200 shadow-slate-100', tableHeader: 'border-slate-200 text-slate-500 bg-slate-100/50' }
    : resolvedTheme === 'high-contrast'
      ? { wrapper: 'bg-black border-white border-2', tableHeader: 'border-white text-white' }
      : { wrapper: 'bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', tableHeader: 'border-white/10 text-slate-400 bg-black/30' };

  return (
    <>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 flex flex-col gap-4 relative ${
                resolvedTheme === 'light'
                  ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]'
                  : resolvedTheme === 'high-contrast'
                  ? 'bg-black border-2 border-white text-white'
                  : 'bg-slate-950 border-white/10 text-white'
              }`}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-white/10 text-[#9B8C83]"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-lg">{translate(locale, 'database', 'AddManualPatch', customTranslations)}</h3>

              <form onSubmit={handleAddPatch} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Czas startowy (ISO)</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border bg-slate-900 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Czas końcowy (ISO)</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border bg-slate-900 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Powód łatki (patchNote)</label>
                  <input
                    type="text"
                    value={patchNote}
                    onChange={(e) => setPatchNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border bg-slate-900 border-white/10 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 text-slate-300 hover:bg-white/10"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-black bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md cursor-pointer"
                  >
                    Zapisz łatkę
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CollapsibleCard
        title={`patch_logs table (${patches?.length || 0} ${translate(locale, 'database', 'Records', customTranslations)})`}
        icon={Database}
        iconColor="text-emerald-400"
        titleColor="text-emerald-400"
        defaultExpanded={true}
        wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
        headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 text-left"
        headerRight={
          <button
            onClick={handleOpenModal}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all hover:scale-[1.01]"
          >
            <Plus className="w-3.5 h-3.5" />
            {translate(locale, 'database', 'AddManualPatch', customTranslations)}
          </button>
        }
      >
      <p className="text-[11px] text-slate-400 mb-4 mt-0.5">{translate(locale, 'database', 'PatchTableAllows', customTranslations)}</p>

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
                <td colSpan={7} className="py-6 text-center text-slate-500 italic">{translate(locale, 'database', 'NoPatchesStandardMode', customTranslations)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  </>
  );
}
