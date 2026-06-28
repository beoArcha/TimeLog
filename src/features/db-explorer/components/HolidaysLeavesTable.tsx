import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { HolidayLeave } from '@bindings/HolidayLeave';
import CollapsibleCard from '@components/CollapsibleCard';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { translate } from '@common/i18n/i18n';
import { LocalStorageDataManager as DataManager } from '@/src/plugins/persistence/DataManager';

export default function HolidaysLeavesTable() {
  const {
    holidays, setHolidays,
    locale, customTranslations, resolvedTheme
  } = useOxyFlow();

  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidayForm, setHolidayForm] = useState<{ name: string; date: string; type: 'holiday' | 'leave'; reason: string }>({ name: '', date: '', type: 'holiday', reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);

  const themeClasses = resolvedTheme === 'light'
    ? { wrapper: 'bg-white border-slate-200 shadow-slate-100', tableHeader: 'border-slate-200 text-slate-500 bg-slate-100/50' }
    : resolvedTheme === 'high-contrast'
      ? { wrapper: 'bg-black border-white border-2', tableHeader: 'border-white text-white' }
      : { wrapper: 'bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-slate-950/40', tableHeader: 'border-white/10 text-slate-400 bg-black/30' };

  const startEditHoliday = (h: HolidayLeave) => {
    setEditingHolidayId(h.id);
    setHolidayForm({ name: h.name, date: h.date, type: h.type, reason: 'Korekta kalendarium' });
  };

  const saveEditHoliday = (id: string) => {
    setHolidays(curr => curr.map(h => {
      if (h.id === id) {
        const hasChanged = h.name !== holidayForm.name || h.date !== holidayForm.date || h.type !== holidayForm.type;
        if (!hasChanged) {
          setEditingHolidayId(null);
          return h;
        }

        const originalName = h.originalName || h.name;
        const originalDate = h.originalDate || h.date;
        const originalType = h.originalType || h.type;

        const newHistoryItem = {
          editedAt: new Date().toISOString(),
          prevName: h.name,
          prevDate: h.date,
          prevType: h.type,
          reason: holidayForm.reason || 'Poprawka w kalendarzu'
        };

        const updatedHistory = h.editHistory ? [...h.editHistory, newHistoryItem] : [newHistoryItem];

        return {
          ...h,
          name: holidayForm.name,
          date: holidayForm.date,
          type: holidayForm.type,
          originalName,
          originalDate,
          originalType,
          editHistory: updatedHistory
        };
      }
      return h;
    }));
    setEditingHolidayId(null);
  };

  return (
    <CollapsibleCard
      title={`holidays_leaves table (${holidays.length} ${translate(locale, 'dynamic.recordsPlural', customTranslations)})`}
      icon={Database}
      iconColor="text-rose-400"
      titleColor="text-rose-400"
      defaultExpanded={true}
      wrapperClassName={`p-6 rounded-3xl border shadow-xl ${themeClasses.wrapper}`}
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-rose-400"
      headerRight={
        <button
          onClick={() => {
            const newEntity: HolidayLeave = {
              id: DataManager.getNextId(holidays, 'e'),
              date: new Date().toISOString().slice(0, 10),
              type: 'holiday',
              name: 'Nowe Święto/Dzień wolny'
            };
            setHolidays(prev => [...prev, newEntity]);
          }}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer"
        >
          {translate(locale, 'dynamic.addLeave', customTranslations)}
        </button>
      }
    >
      <div className="overflow-x-auto w-full max-h-[300px] overflow-y-auto">
        <table className="w-full text-xs font-mono text-left whitespace-nowrap">
          <thead>
            <tr className={`border-b ${themeClasses.tableHeader} uppercase text-[10px] tracking-wide`}>
              <th className="py-3 px-4 rounded-l-xl">id</th>
              <th className="py-3 px-4">date</th>
              <th className="py-3 px-4">type</th>
              <th className="py-3 px-4">name</th>
              <th className="py-3 px-4">{translate(locale, 'dynamic.originalValue', customTranslations)}</th>
              <th className="py-3 px-4 rounded-r-xl text-right">{translate(locale, 'dbExplorer.actions', customTranslations)}</th>
            </tr>
          </thead>
          <tbody className="dark:text-white">
            {holidays.map(h => {
              const isEditing = editingHolidayId === h.id;
              const hasHistory = !!(h.originalName || h.originalDate || h.originalType || h.editHistory);

              return (
                <React.Fragment key={h.id}>
                  <tr className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3.5 px-4 font-bold text-slate-400">{h.id}</td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={holidayForm.date}
                          onChange={e => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                          className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded text-white"
                        />
                      ) : (
                        <span className="font-bold text-orange-500 dark:text-orange-400">{h.date}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <select
                          value={holidayForm.type}
                          onChange={e => setHolidayForm(prev => ({ ...prev, type: e.target.value as any }))}
                          className="bg-black border border-white/20 px-2 py-1 rounded"
                        >
                          <option value="holiday">{translate(locale, 'dbExplorer.holiday', customTranslations)}</option>
                          <option value="leave">{translate(locale, 'dbExplorer.leave', customTranslations)}</option>
                        </select>
                      ) : (
                        <span className="text-indigo-400">{h.type}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {isEditing ? (
                        <input
                          type="text"
                          value={holidayForm.name}
                          onChange={e => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded max-w-xs text-white"
                        />
                      ) : (
                        <span>{h.name}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {hasHistory ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-md font-bold">
                          Oryg: {h.originalName || h.name} ({h.originalDate})
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">{translate(locale, 'dbExplorer.noChanges', customTranslations)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasHistory && (
                          <button
                            onClick={() => setShowHistoryRecordId(showHistoryRecordId === h.id ? null : h.id)}
                            className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              placeholder="Powód zmiany"
                              value={holidayForm.reason}
                              onChange={e => setHolidayForm(prev => ({ ...prev, reason: e.target.value }))}
                              className="text-[9px] bg-black/45 border border-white/10 px-1 py-0.5 rounded w-28 text-white mr-1"
                            />
                            <button onClick={() => saveEditHoliday(h.id)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingHolidayId(null)} className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditHoliday(h)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setHolidays(prev => prev.filter(x => x.id !== h.id))} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {showHistoryRecordId === h.id && h.editHistory && (
                    <tr>
                      <td colSpan={6} className="py-3 px-5 bg-black/20 border-b border-white/5 rounded-b-2xl">
                        <div className="flex flex-col gap-1.2 border-l-2 border-teal-500 pl-4 py-1">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
                            <History className="w-3" /> Audit historii świąt/urlopów
                          </p>
                          {h.editHistory.map((x, idx) => (
                            <div key={idx} className="text-[11px] text-slate-400 mt-1">
                              <span className="text-slate-500">[{new Date(x.editedAt).toLocaleString()}]</span>{' '}
                              {translate(locale, 'dbExplorer.modificationFrom', customTranslations)} <strong className="text-white">"{x.prevName}"</strong> ({x.prevDate}, {translate(locale, 'dbExplorer.type', customTranslations)} {x.prevType}) &rarr;{' '}
                              {translate(locale, 'dbExplorer.reasonForModification', customTranslations)} <em className="text-teal-350">"{x.reason}"</em>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  );
}
