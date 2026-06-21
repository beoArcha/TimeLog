import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Database } from 'lucide-react';
import { translate } from '@core/i18n/i18n';
import { LocalStorageDataManager as DataManager } from '@core/data/dataManager';
import { useOxyFlow } from '@core/providers/OxyContext';
import CollapsibleCard from './CollapsibleCard';

export default function HolidaysAndLeaves() {
  const { theme, holidays, setHolidays, locale } = useOxyFlow();
  const { customTranslations } = useOxyFlow();

  const [newHolidayDate, setNewHolidayDate] = useState('2026-06-15');
  const [newHolidayType, setNewHolidayType] = useState<'holiday' | 'leave'>('leave');
  const [newHolidayName, setNewHolidayName] = useState('');

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName) return;
    setHolidays(prev => [...prev, {
      id: DataManager.getNextId(holidays, 'h'),
      date: newHolidayDate,
      type: newHolidayType,
      name: newHolidayName
    }]);
    setNewHolidayName('');
  };

  return (
    <div className={`p-6 rounded-[2rem] border shadow-2xl flex flex-col gap-6 transition-all duration-300 ${theme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB] shadow-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
      }`}>
      <div>
        <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
          {translate(locale, 'dynamic.resourceDatabaseTable', customTranslations)}
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1.5">
          <h2 className={`font-sans font-bold text-2xl flex items-center gap-2 ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'
            }`}>
            <Calendar className="w-6 h-6 text-orange-400" />
            {translate(locale, 'dynamic.holidaysVacations', customTranslations)}
          </h2>
        </div>
      </div>

      <CollapsibleCard
        title={translate(locale, 'dynamic.rEGISTERNEWDAYOFFSQLINSERT', customTranslations)}
        icon={Plus}
        iconColor="text-orange-400"
        titleColor={theme === 'light' ? 'text-[#2C2421]' : 'text-white'}
        defaultExpanded={true}
        wrapperClassName={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-black/25 border-white/10'}`}
        headerClassName={`text-xs font-bold font-mono tracking-wide ${theme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}
      >
        <form onSubmit={handleAddHolidaySubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.date', customTranslations)}</label>
              <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} required className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono ${theme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]' : 'bg-black/50 border-white/10 text-white'}`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.type', customTranslations)}</label>
              <select value={newHolidayType} onChange={e => setNewHolidayType(e.target.value as any)} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono ${theme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]' : 'bg-black/50 border-white/10 text-white'}`}>
                <option value="leave">{translate(locale, 'dynamic.vacationLeave', customTranslations)}</option>
                <option value="holiday">{translate(locale, 'dynamic.officialHoliday', customTranslations)}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono tracking-wider text-[#9B8C83] uppercase">{translate(locale, 'dynamic.descriptionCause', customTranslations)}</label>
              <input type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder={translate(locale, 'dynamic.eGVibeDancingLeave', customTranslations)} required className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-sans ${theme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421] placeholder:text-[#9B8C83]' : 'bg-black/50 border-white/10 text-white placeholder:text-[#8A7A71]'}`} />
            </div>
          </div>
          <button type="submit" className="mt-4 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all w-full md:w-auto">
            <Plus className="w-4 h-4" /> {translate(locale, 'dynamic.save', customTranslations)}
          </button>
        </form>
      </CollapsibleCard>

      <CollapsibleCard
        title={`📋 ${translate(locale, 'dynamic.sQLiteHolidaysTableRowsMicroOR', customTranslations)} (${holidays.length})`}
        icon={Database}
        iconColor="text-[#9B8C83]"
        titleColor="text-[#9B8C83]"
        defaultExpanded={true}
        wrapperClassName={`rounded-3xl border overflow-hidden ${theme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB]' : 'bg-black/20 border-white/10'}`}
        headerClassName={`px-5 py-3 border-b text-xs font-mono font-bold tracking-wider uppercase text-[#9B8C83] ${theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans text-left whitespace-nowrap">

            <thead>
              <tr className={`border-b text-xs font-bold font-mono tracking-wider uppercase ${theme === 'light' ? 'border-[#DFD7CB] text-[#7A6A61] bg-[#F4EFEA]/50' : 'border-white/10 text-[#9B8C83] bg-black/40'}`}>
                <th className="py-2.5 px-4">{translate(locale, 'dynamic.recordName', customTranslations)}</th>
                <th className="py-2.5 px-4">{translate(locale, 'dynamic.scheduledDate', customTranslations)}</th>
                <th className="py-2.5 px-4">{translate(locale, 'dynamic.weekday', customTranslations)}</th>
                <th className="py-2.5 px-4">{translate(locale, 'dynamic.type', customTranslations)}</th>
                <th className="py-2.5 px-4 text-right">{translate(locale, 'dynamic.actions', customTranslations)}</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#9B8C83] text-xs font-mono">
                    {translate(locale, 'dynamic.noEntriesFoundInputAVacationAb', customTranslations)}
                  </td>
                </tr>
              ) : (
                holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(h => {
                  const d = new Date(h.date);
                  const weekdayStr = d.toLocaleDateString(locale, { weekday: 'short' });

                  return (
                    <tr key={h.id} className={`border-b last:border-b-0 ${theme === 'light' ? 'border-[#EAE4DB] hover:bg-[#F4EFEA] text-[#5A4A42]' : 'border-white/5 hover:bg-[#FCFAF8]/5 text-slate-300'}`}>
                      <td className="py-3 px-4 font-semibold">{h.name}</td>
                      <td className="py-3 px-4 font-mono text-xs">{h.date}</td>
                      <td className="py-3 px-4 font-mono text-xs text-[#9B8C83]">{weekdayStr}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${h.type === 'holiday'
                            ? theme === 'light' ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-300'
                            : theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                          {h.type === 'holiday' ? translate(locale, 'dynamic.hOLIDAY', customTranslations) : translate(locale, 'dynamic.vACATION', customTranslations)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => setHolidays(prev => prev.filter(x => x.id !== h.id))} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors" title={translate(locale, 'dynamic.deleteSQLDELETE', customTranslations)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CollapsibleCard>
    </div>
  );
}
