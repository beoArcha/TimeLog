import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { HolidayLeave } from '@bindings/HolidayLeave';
import CollapsibleCard from '@components/CollapsibleCard';
import { translate } from '@common/i18n/translator';
import { getNextId } from '@common/utils/idGenerator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui/table';
import { Input } from '@components/ui/input';
import { NativeSelect } from '@components/ui/select';
import { Button } from '@components/ui/button';

export default function HolidaysLeavesTable() {
  const { locale, customTranslations } = useLocale();
  const { holidays, setHolidays } = useData();

  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidayForm, setHolidayForm] = useState<{ name: string; date: string; type: 'holiday' | 'leave'; reason: string }>({ name: '', date: '', type: 'holiday', reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);

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
      title={`holidays_leaves table (${holidays.length} ${translate(locale, 'database', 'RecordsPlural', customTranslations)})`}
      icon={Database}
      iconColor="text-rose-400"
      titleColor="text-rose-400"
      defaultExpanded={true}
      wrapperClassName="p-6 rounded-3xl border border-border bg-card shadow-xl"
      headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-rose-400"
      headerRight={
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            const newEntity: HolidayLeave = {
              id: getNextId(holidays, 'e'),
              date: new Date().toISOString().slice(0, 10),
              type: 'holiday',
              name: 'Nowe Święto/Dzień wolny'
            };
            setHolidays(prev => [...prev, newEntity]);
          }}
          className="rounded-xl font-bold transition-all cursor-pointer h-auto py-1.5 px-3"
        >
          {translate(locale, 'calendar', 'AddLeave', customTranslations)}
        </Button>
      }
    >
      <div className="overflow-x-auto w-full max-h-[300px] overflow-y-auto">
        <Table className="w-full text-xs font-mono text-left whitespace-nowrap">
          <TableHeader>
            <TableRow className="border-b border-border text-muted-foreground bg-muted/50 uppercase text-[10px] tracking-wide">
              <TableHead className="py-3 px-4 rounded-l-xl">id</TableHead>
              <TableHead className="py-3 px-4">date</TableHead>
              <TableHead className="py-3 px-4">type</TableHead>
              <TableHead className="py-3 px-4">name</TableHead>
              <TableHead className="py-3 px-4">{translate(locale, 'database', 'OriginalValue', customTranslations)}</TableHead>
              <TableHead className="py-3 px-4 rounded-r-xl text-right">{translate(locale, 'common', 'Actions', customTranslations)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-foreground">
            {holidays.map(h => {
              const isEditing = editingHolidayId === h.id;
              const hasHistory = !!(h.originalName || h.originalDate || h.originalType || h.editHistory);

              return (
                <React.Fragment key={h.id}>
                  <TableRow className="border-b border-border/50 hover:bg-muted/50">
                    <TableCell className="py-3.5 px-4 font-bold text-muted-foreground">{h.id}</TableCell>
                    <TableCell className="py-3.5 px-4">
                      {isEditing ? (
                        <Input
                          type="text"
                          value={holidayForm.date}
                          onChange={e => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                          className="bg-background border border-border px-2 py-1 h-7 rounded text-foreground"
                        />
                      ) : (
                        <span className="font-bold text-orange-500 dark:text-orange-400">{h.date}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {isEditing ? (
                        <div className="w-28">
                          <NativeSelect
                            value={holidayForm.type}
                            onChange={e => setHolidayForm(prev => ({ ...prev, type: e.target.value as HolidayLeave['type'] }))}
                            className="h-7 text-xs bg-background border border-border text-foreground"
                          >
                            <option value="holiday">{translate(locale, 'database', 'HolidayType', customTranslations)}</option>
                            <option value="leave">{translate(locale, 'database', 'LeaveType', customTranslations)}</option>
                          </NativeSelect>
                        </div>
                      ) : (
                        <span className="text-indigo-400">{h.type}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-foreground">
                      {isEditing ? (
                        <Input
                          type="text"
                          value={holidayForm.name}
                          onChange={e => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-background border border-border px-2 py-1 h-7 rounded max-w-xs text-foreground"
                        />
                      ) : (
                        <span>{h.name}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {hasHistory ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-md font-bold">
                          Oryg: {h.originalName || h.name} ({h.originalDate})
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">{translate(locale, 'database', 'NoChanges', customTranslations)}</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasHistory && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setShowHistoryRecordId(showHistoryRecordId === h.id ? null : h.id)}
                            className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {isEditing ? (
                          <>
                            <Input
                              type="text"
                              placeholder="Powód zmiany"
                              value={holidayForm.reason}
                              onChange={e => setHolidayForm(prev => ({ ...prev, reason: e.target.value }))}
                              className="text-[9px] bg-background border border-border px-1 py-0.5 h-6 rounded w-28 text-foreground mr-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => saveEditHoliday(h.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditingHolidayId(null)}
                              className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => startEditHoliday(h)}
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setHolidays(prev => prev.filter(x => x.id !== h.id))}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {showHistoryRecordId === h.id && h.editHistory && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-3 px-5 bg-muted/30 border-b border-border/50 rounded-b-2xl">
                        <div className="flex flex-col gap-1.2 border-l-2 border-teal-500 pl-4 py-1">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
                            <History className="w-3" /> Audit historii świąt/urlopów
                          </p>
                          {h.editHistory.map((x, idx) => (
                            <div key={idx} className="text-[11px] text-muted-foreground mt-1">
                              <span>[{new Date(x.editedAt).toLocaleString()}]</span>{' '}
                              {translate(locale, 'database', 'ModificationFrom', customTranslations)} <strong className="text-foreground">"{x.prevName}"</strong> ({x.prevDate}, {translate(locale, 'common', 'Type', customTranslations)} {x.prevType}) &rarr;{' '}
                              {translate(locale, 'database', 'ReasonForModification', customTranslations)} <em className="text-teal-300">"{x.reason}"</em>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </CollapsibleCard>
  );
}
