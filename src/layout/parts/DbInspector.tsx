import React from 'react';
import { GuiState } from '../useGuiLogic';
import { Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translate } from '@core/i18n/i18n';

export default function DbInspector({ state, isCondensed }: { state: GuiState; isCondensed: boolean }) {
  const {
    projects, tasks, logs, nowIso, locale, customTranslations, theme,
    showDbInspector, setShowDbInspector
  } = state;

  return (
    <div className={`mt-2 flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden ${theme === 'light'
      ? 'bg-[#FCFAF8] shadow-[#DFD7CB]/30 border-[#DFD7CB]'
      : theme === 'high-contrast'
        ? 'bg-black border-2 border-white text-white'
        : 'bg-[#FCFAF8]/5 border-white/10 text-slate-100 backdrop-blur-xl'
      }`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => setShowDbInspector(!showDbInspector)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-[#F4EFEA] border border-[#DFD7CB]' : 'bg-[#FCFAF8]/10 border border-white/10'
            }`}>
            <Database className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-sm ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-100'}`}>oxytime.db • SQLite Client</span>
            <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]'}`}>Simulated microORM State</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showDbInspector && (
            <span className="hidden sm:inline-block bg-orange-500/20 border border-orange-500/30 text-[10px] text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold">ONLINE</span>
          )}
          <button
            id="toggle-db-inspector-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowDbInspector(!showDbInspector);
            }}
            className={`flex items-center gap-2 border font-mono text-xs px-4 py-2 rounded-2xl transition-all cursor-pointer ${theme === 'light'
              ? 'bg-[#F4EFEA] hover:bg-[#EAE4DB] text-[#5A4A42] border-[#DFD7CB]'
              : 'bg-[#FCFAF8]/10 hover:bg-[#FCFAF8]/20 text-slate-200 hover:text-white border-white/10'
              }`}
          >
            {showDbInspector ? translate(locale, 'dynamic.hideSqlitePreview', customTranslations) : translate(locale, 'dynamic.exploreSqliteStructure', customTranslations)}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDbInspector && (
          <motion.div
            id="db-inspector-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`p-4 pt-4 md:p-6 md:pt-4 border-t font-mono text-xs gap-4 flex flex-col ${theme === 'light' ? 'border-[#DFD7CB]/50' : 'border-white/10'
              }`}>
              <div className={`flex flex-col gap-4 pb-2 ${!isCondensed ? 'md:grid md:grid-cols-2' : ''}`}>
                <div className={`flex-1 p-3 rounded-xl border flex flex-col ${theme === 'light' ? 'bg-[#F4EFEA]/50 border-[#DFD7CB]' : 'bg-black/20 border-white/10'
                  }`}>
                  <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans shrink-0">TABLE projects</p>
                  <div className="overflow-auto scroller-hide max-h-[200px] w-full">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className={`border-b text-[10px] ${theme === 'light' ? 'border-[#DFD7CB] text-[#7A6A61]' : 'border-white/10 text-[#9B8C83]'
                          }`}>
                          <th className="py-1 pr-4">id</th>
                          <th className="py-1 pr-4">name</th>
                          <th className="py-1">created_at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map(p => (
                          <tr key={p.id} className={theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}>
                            <td className="py-1 pr-4 prose-sm font-bold text-indigo-550 dark:text-indigo-400">{p.id}</td>
                            <td className="py-1 pr-4">{p.name}</td>
                            <td className="py-1 text-[9px] text-[#8A7A71]">{new Date(p.createdAt).toISOString().slice(0, 10)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`flex-1 p-3 rounded-xl border flex flex-col ${theme === 'light' ? 'bg-[#F4EFEA]/50 border-[#DFD7CB]' : 'bg-black/20 border-white/10'
                  }`}>
                  <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans shrink-0">TABLE tasks</p>
                  <div className="overflow-auto scroller-hide max-h-[200px] w-full">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className={`border-b text-[10px] ${theme === 'light' ? 'border-[#DFD7CB] text-[#7A6A61]' : 'border-white/10 text-[#9B8C83]'
                          }`}>
                          <th className="py-1 pr-4">id</th>
                          <th className="py-1 pr-4">proj_id</th>
                          <th className="py-1 pr-4">parent_id</th>
                          <th className="py-1">name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.slice(0, 8).map(t => (
                          <tr key={t.id} className={theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}>
                            <td className="py-1 pr-4 font-bold text-indigo-550 dark:text-indigo-400">{t.id}</td>
                            <td className="py-1 pr-4">{t.projectId}</td>
                            <td className="py-1 pr-4 text-[#8A7A71]">{t.parentTaskId || 'NULL'}</td>
                            <td className="py-1 truncate max-w-[120px]" title={t.name}>{t.name}</td>
                          </tr>
                        ))}
                        {tasks.length > 8 && (
                          <tr>
                            <td colSpan={4} className="text-[10px] text-[#8A7A71] py-1 text-center">
                              {translate(locale, 'dynamic.andMoreRows', customTranslations).replace('{x}', (tasks.length - 8).toString())}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`flex-1 w-full p-3 rounded-xl border flex flex-col ${!isCondensed ? 'md:col-span-2' : ''} ${theme === 'light' ? 'bg-[#F4EFEA]/50 border-[#DFD7CB]' : 'bg-black/20 border-white/10'
                  }`}>
                  <p className="text-orange-500 dark:text-orange-400 font-bold mb-1.5 font-sans shrink-0">TABLE time_logs</p>
                  <div className="overflow-auto scroller-hide max-h-[250px] w-full">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className={`border-b text-[10px] ${theme === 'light' ? 'border-[#DFD7CB] text-[#7A6A61]' : 'border-white/10 text-[#9B8C83]'
                          }`}>
                          <th className="py-1 pr-4">id</th>
                          <th className="py-1 pr-4">task_id</th>
                          <th className="py-1 pr-4">start_time</th>
                          <th className="py-1 pr-4">end_time</th>
                          <th className="py-1">duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.slice(-8).map(l => {
                          const start = new Date(l.startTime).toLocaleTimeString();
                          const end = l.endTime ? new Date(l.endTime).toLocaleTimeString() : 'ACTIVE';
                          const startMs = new Date(l.startTime).getTime();
                          const endMs = l.endTime ? new Date(l.endTime).getTime() : new Date(nowIso).getTime();
                          const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));

                          return (
                            <tr key={l.id} className={theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}>
                              <td className="py-1 pr-4 text-indigo-550 dark:text-indigo-400 font-bold">{l.id.slice(0, 6)}</td>
                              <td className="py-1 pr-4">{l.taskId}</td>
                              <td className="py-1 pr-4 text-[10px]">{start}</td>
                              <td className="py-1 pr-4 text-[10px] font-semibold text-orange-500 dark:text-orange-400">{end}</td>
                              <td className="py-1 text-[10px] text-right font-mono">{diffSec}s</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
