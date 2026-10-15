import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Database } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import CollapsibleCard from '@components/CollapsibleCard';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { NativeSelect } from '@components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/table';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useData } from '@common/hooks/DataContext';

export default function HolidaysLeavesView() {
  const { locale, customTranslations } = useLocale();
  const { theme } = useSettings();
  const { holidays, handleAddHoliday, handleDeleteHoliday } = useData();

  const [newHolidayDate, setNewHolidayDate] = useState('2026-06-15');
  const [newHolidayType, setNewHolidayType] = useState<'holiday' | 'leave'>('leave');
  const [newHolidayName, setNewHolidayName] = useState('');

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName) return;
    handleAddHoliday(newHolidayDate, newHolidayType, newHolidayName);
    setNewHolidayName('');
  };

  return (
    <div className={`p-6 rounded-[2rem] border shadow-2xl flex flex-col gap-6 transition-all duration-300 ${theme === 'light' ? 'bg-card border-border shadow-xs' : 'bg-card/50 border-white/10'
      }`}>
      <div>
        <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
          {translate(locale, 'calendar', 'ResourceDatabaseTable', customTranslations)}
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1.5">
          <h2 className={`font-sans font-bold text-2xl flex items-center gap-2 ${theme === 'light' ? 'text-foreground' : 'text-white'
            }`}>
          <Calendar className="w-6 h-6 text-orange-400" />
            {translate(locale, 'calendar', 'HolidaysVacations', customTranslations)}
          </h2>
        </div>
      </div>

      <CollapsibleCard
        title={translate(locale, 'calendar', 'RegisterNewDayOff', customTranslations)}
        icon={Plus}
        iconColor="text-orange-400"
        titleColor={theme === 'light' ? 'text-foreground' : 'text-white'}
        defaultExpanded={true}
        wrapperClassName={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-muted/30 border-border' : 'bg-black/25 border-white/10'}`}
        headerClassName={`text-xs font-bold font-mono tracking-wide ${theme === 'light' ? 'text-foreground' : 'text-white'}`}
      >
        <form onSubmit={handleAddHolidaySubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{translate(locale, 'common', 'Date', customTranslations)}</Label>
              <Input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} required className="w-full font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{translate(locale, 'common', 'Type', customTranslations)}</Label>
              <NativeSelect value={newHolidayType} onChange={e => setNewHolidayType(e.target.value as any)} className="w-full font-mono">
                <option value="leave">{translate(locale, 'calendar', 'VacationLeave', customTranslations)}</option>
                <option value="holiday">{translate(locale, 'calendar', 'OfficialHoliday', customTranslations)}</option>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{translate(locale, 'calendar', 'DescriptionCause', customTranslations)}</Label>
              <Input type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder={translate(locale, 'calendar', 'EGVibeDancingLeave', customTranslations)} required className="w-full font-sans" />
            </div>
          </div>
          <Button type="submit" className="mt-4 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 transition-all w-full md:w-auto h-auto">
            <Plus className="w-4 h-4" /> {translate(locale, 'common', 'Save', customTranslations)}
          </Button>
        </form>
      </CollapsibleCard>

      <CollapsibleCard
        title={`📋 ${translate(locale, 'calendar', 'SqliteHolidaysTableRows', customTranslations)} (${holidays.length})`}
        icon={Database}
        iconColor="text-muted-foreground"
        titleColor="text-muted-foreground"
        defaultExpanded={true}
        wrapperClassName={`rounded-3xl border overflow-hidden ${theme === 'light' ? 'bg-card border-border' : 'bg-black/20 border-white/10'}`}
        headerClassName={`px-5 py-3 border-b text-xs font-mono font-bold tracking-wider uppercase text-muted-foreground ${theme === 'light' ? 'bg-muted/50 border-border' : 'bg-card/5 border-white/10'}`}
      >
        <div className="overflow-x-auto">
          <Table className="w-full text-sm font-sans text-left whitespace-nowrap">
            <TableHeader>
              <TableRow className={`border-b text-xs font-bold font-mono tracking-wider uppercase ${theme === 'light' ? 'border-border text-muted-foreground bg-muted/30' : 'border-white/10 text-muted-foreground bg-black/40'}`}>
                <TableHead className="py-2.5 px-4">{translate(locale, 'calendar', 'RecordName', customTranslations)}</TableHead>
                <TableHead className="py-2.5 px-4">{translate(locale, 'calendar', 'ScheduledDate', customTranslations)}</TableHead>
                <TableHead className="py-2.5 px-4">{translate(locale, 'calendar', 'Weekday', customTranslations)}</TableHead>
                <TableHead className="py-2.5 px-4">{translate(locale, 'common', 'Type', customTranslations)}</TableHead>
                <TableHead className="py-2.5 px-4 text-right">{translate(locale, 'common', 'Actions', customTranslations)}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground text-xs font-mono">
                    {translate(locale, 'calendar', 'NoEntriesFound', customTranslations)}
                  </TableCell>
                </TableRow>
              ) : (
                holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(h => {
                  const d = new Date(h.date);
                  const weekdayStr = d.toLocaleDateString(locale, { weekday: 'short' });

                  return (
                    <TableRow key={h.id} className={`border-b last:border-b-0 ${theme === 'light' ? 'border-border hover:bg-muted/40 text-foreground' : 'border-white/5 hover:bg-card/5 text-slate-300'}`}>
                      <TableCell className="py-3 px-4 font-semibold">{h.name}</TableCell>
                      <TableCell className="py-3 px-4 font-mono text-xs">{h.date}</TableCell>
                      <TableCell className="py-3 px-4 font-mono text-xs text-muted-foreground">{weekdayStr}</TableCell>
                      <TableCell className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${h.type === 'holiday'
                          ? theme === 'light' ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-300'
                          : theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                          {h.type === 'holiday' ? translate(locale, 'calendar', 'Holiday', customTranslations) : translate(locale, 'calendar', 'Vacation', customTranslations)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="h-7 w-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                          title={translate(locale, 'calendar', 'DeleteSqlDelete', customTranslations)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleCard>
    </div>
  );
}
