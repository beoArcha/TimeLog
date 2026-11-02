import React, { useState } from 'react';
import { Database, Edit3, Trash2, Check, X, History } from 'lucide-react';
import { HolidayLeave } from '@bindings/HolidayLeave';
import CollapsibleCard from '@components/CollapsibleCard';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { DataTable, type DataTableColumn } from '@components/DataTable';
import { TableRow, TableCell } from '@components/ui/table';
import { Input } from '@components/ui/input';
import { NativeSelect } from '@components/ui/select';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Caption, Overline } from '@components/ui/typography';
import { HolidayType } from '@bindings/HolidayType';

export interface HolidaysLeavesTableProps {
  requireConfirm?: boolean;
  hideAddButton?: boolean;
  wrapperClassName?: string;
}

export default function HolidaysLeavesTable({
  requireConfirm = true,
  hideAddButton = false,
  wrapperClassName = 'p-6 rounded-3xl border border-border bg-card shadow-xl',
}: HolidaysLeavesTableProps = {}) {
  const { locale, customTranslations } = useLocale();
  const { holidays, handleAddHoliday, handleUpdateHoliday, handleDeleteHoliday } = useData();

  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidayForm, setHolidayForm] = useState<{ name: string; date: string; type: HolidayType; reason: string }>({ name: '', date: '', type: 'holiday', reason: '' });
  const [showHistoryRecordId, setShowHistoryRecordId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const startEditHoliday = (h: HolidayLeave) => {
    setEditingHolidayId(h.id);
    setHolidayForm({
      name: h.name,
      date: h.date,
      type: h.type,
      reason: translate(locale, 'database', 'CalendarCorrection', customTranslations)
    });
  };

  const saveEditHoliday = async (id: string) => {
    const h = holidays.find(item => item.id === id);
    if (!h) return;
    const hasChanged = h.name !== holidayForm.name || h.date !== holidayForm.date || h.type !== holidayForm.type;
    if (!hasChanged) {
      setEditingHolidayId(null);
      return;
    }
    if (handleUpdateHoliday) {
      await handleUpdateHoliday(id, holidayForm.date, holidayForm.type, holidayForm.name, holidayForm.reason);
    }
    setEditingHolidayId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    if (handleDeleteHoliday) {
      await handleDeleteHoliday(id);
    }
  };

  const columns: DataTableColumn<HolidayLeave>[] = [
    { key: 'id', header: 'id' },
    { key: 'date', header: 'date' },
    { key: 'type', header: 'type' },
    { key: 'name', header: 'name' },
    { key: 'originalValue', header: translate(locale, 'database', 'OriginalValue', customTranslations) },
    { key: 'actions', header: translate(locale, 'common', 'Actions', customTranslations), align: 'right' },
  ];

  return (
    <>
      <CollapsibleCard
        title={`holidays_leaves table (${holidays.length} ${translate(locale, 'database', 'RecordsPlural', customTranslations)})`}
        icon={Database}
        iconColor="text-primary"
        titleColor="text-primary"
        defaultExpanded={true}
        wrapperClassName={wrapperClassName}
        headerClassName="text-xs font-mono font-bold uppercase tracking-widest text-primary"
        headerRight={
          hideAddButton ? null : (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                if (handleAddHoliday) {
                  handleAddHoliday(
                    new Date().toISOString().slice(0, 10),
                    'holiday',
                    translate(locale, 'database', 'NewHolidayDefaultName', customTranslations)
                  );
                }
              }}
              className="rounded-xl font-bold transition-all cursor-pointer h-auto py-1.5 px-3"
            >
              {translate(locale, 'calendar', 'AddLeave', customTranslations)}
            </Button>
          )
        }
      >
        <DataTable<HolidayLeave>
          columns={columns}
          data={holidays}
          keyExtractor={(h) => h.id}
          maxHeight="300px"
          className="text-xs font-mono"
          renderRow={(h) => {
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
                          <span className="font-bold text-foreground">{h.date}</span>
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
                          <span className="text-muted-foreground">{h.type}</span>
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
                          <Badge variant="amber" size="sm" as="span">
                            {translate(locale, 'database', 'OriginalLabel', customTranslations)}: {h.originalName || h.name} ({h.originalDate})
                          </Badge>
                        ) : (
                          <Caption as="span">{translate(locale, 'database', 'NoChanges', customTranslations)}</Caption>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {hasHistory && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setShowHistoryRecordId(showHistoryRecordId === h.id ? null : h.id)}
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer"
                              title={translate(locale, 'database', 'RevisionHistory', customTranslations)}
                              aria-label={translate(locale, 'database', 'RevisionHistory', customTranslations)}
                            >
                              <History className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {isEditing ? (
                            <>
                              <Input
                                type="text"
                                placeholder={translate(locale, 'database', 'ReasonForModification', customTranslations)}
                                aria-label={translate(locale, 'database', 'ReasonForModification', customTranslations)}
                                value={holidayForm.reason}
                                onChange={e => setHolidayForm(prev => ({ ...prev, reason: e.target.value }))}
                                className="text-xs bg-background border border-border px-1 py-0.5 h-6 rounded w-28 text-foreground mr-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => saveEditHoliday(h.id)}
                                className="p-1.5 rounded-lg bg-success/20 hover:bg-success/30 text-success cursor-pointer"
                                title={translate(locale, 'common', 'Save', customTranslations)}
                                aria-label={translate(locale, 'common', 'Save', customTranslations)}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setEditingHolidayId(null)}
                                className="p-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive cursor-pointer"
                                title={translate(locale, 'common', 'Cancel', customTranslations)}
                                aria-label={translate(locale, 'common', 'Cancel', customTranslations)}
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
                                title={translate(locale, 'common', 'Edit', customTranslations)}
                                aria-label={translate(locale, 'common', 'Edit', customTranslations)}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => {
                                  if (requireConfirm) {
                                    setDeleteTargetId(h.id);
                                  } else if (handleDeleteHoliday) {
                                    handleDeleteHoliday(h.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive cursor-pointer"
                                title={translate(locale, 'common', 'Delete', customTranslations)}
                                aria-label={translate(locale, 'common', 'Delete', customTranslations)}
                              >
                                <Trash2 className="w-3.5 h-3.5 lucide-trash2" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {showHistoryRecordId === h.id && h.editHistory && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-3 px-5 bg-muted/30 border-b border-border/50 rounded-b-2xl">
                          <div className="flex flex-col gap-1.2 border-l-2 border-primary pl-4 py-1">
                            <Overline className="text-primary flex items-center gap-1.5">
                              <History className="w-3" /> {translate(locale, 'database', 'AuditTrailHolidays', customTranslations)}
                            </Overline>
                            {h.editHistory.map((x, idx) => (
                              <Caption key={idx} size="xs" className="text-muted-foreground mt-1 block">
                                <span>[{new Date(x.editedAt).toLocaleString()}]</span>{' '}
                                {translate(locale, 'database', 'ModificationFrom', customTranslations)} <strong className="text-foreground">"{x.prevName}"</strong> ({x.prevDate}, {translate(locale, 'common', 'Type', customTranslations)} {x.prevType}) &rarr;{' '}
                                {translate(locale, 'database', 'ReasonForModification', customTranslations)} <em className="text-foreground">"{x.reason}"</em>
                              </Caption>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              }}
            />
          </CollapsibleCard>

      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title={translate(locale, 'database', 'DeleteConfirmHoliday', customTranslations)}
        variant="destructive"
        confirmLabel={translate(locale, 'common', 'Delete', customTranslations)}
        cancelLabel={translate(locale, 'common', 'Cancel', customTranslations)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
