import { useState } from 'react';
import { Edit3, Trash2, Check, X, History } from 'lucide-react';
import { TimeLog } from '@bindings/TimeLog';
import { translate } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import { TableRow, TableCell } from '@components/ui/table';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Caption, Overline } from '@components/ui/typography';

interface TimeLogTableRowProps {
  key?: string | number;
  l: TimeLog;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (startTime: string, endTime: string, note: string, reason: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  locale: Locale;
  customTranslations: Record<string, unknown>;
  showHistory: boolean;
  onToggleHistory: () => void;
}

export default function TimeLogTableRow({
  l,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  locale,
  customTranslations,
  showHistory,
  onToggleHistory
}: TimeLogTableRowProps) {
  const [form, setForm] = useState({
    startTime: l.startTime,
    endTime: l.endTime || '',
    note: l.note || '',
    reason: translate(locale, 'database', 'SyncErrorReason', customTranslations)
  });

  const hasHistory = !!(l.editHistory && l.editHistory.length > 0);

  const getOriginalStartTime = () => {
    if (!l.editHistory || l.editHistory.length === 0) return l.startTime;
    for (const h of l.editHistory) {
      if (h.prevStartTime) {
        return h.prevStartTime;
      }
    }
    return l.startTime;
  };

  const handleSave = () => {
    onSaveEdit(form.startTime, form.endTime, form.note, form.reason);
  };

  return (
    <>
      <TableRow className="border-b border-white/5 hover:bg-white/5 text-left">
        <TableCell className="py-3.5 px-4 font-bold text-muted-foreground">{l.id}</TableCell>
        <TableCell className="py-3.5 px-4 text-teal-400 font-bold">{l.taskId}</TableCell>
        <TableCell className="py-3.5 px-4">
          {isEditing ? (
            <Input
              type="text"
              value={form.startTime}
              onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
              className="bg-black/35 border border-white/20 px-2 py-1 h-7 rounded text-white"
              aria-label={translate(locale, 'database', 'StartTime', customTranslations)}
            />
          ) : (
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{l.startTime}</span>
          )}
        </TableCell>
        <TableCell className="py-3.5 px-4">
          {isEditing ? (
            <Input
              type="text"
              value={form.endTime}
              onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
              className="bg-black/35 border border-white/20 px-2 py-1 h-7 rounded text-white"
              placeholder={translate(locale, 'database', 'EndTime', customTranslations)}
              aria-label={translate(locale, 'database', 'EndTime', customTranslations)}
            />
          ) : (
            <span className="text-indigo-400 font-semibold">{l.endTime || translate(locale, 'database', 'TrackingActiveLabel', customTranslations)}</span>
          )}
        </TableCell>
        <TableCell className="py-3.5 px-4 truncate max-w-xs">
          {isEditing ? (
            <Input
              type="text"
              value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
              className="bg-black/35 border border-white/20 px-2 py-1 h-7 rounded text-white"
              aria-label={translate(locale, 'database', 'Note', customTranslations)}
            />
          ) : (
            <span>{l.note || <span className="text-muted-foreground italic">{translate(locale, 'database', 'NoNote', customTranslations)}</span>}</span>
          )}
        </TableCell>
        <TableCell className="py-3.5 px-4">
          {hasHistory ? (
            <Badge variant="amber" size="sm" as="span" className="w-max">
              {translate(locale, 'database', 'OriginalStart', customTranslations)} {getOriginalStartTime() ? new Date(getOriginalStartTime()).toLocaleTimeString() : 'N/A'}
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
                onClick={onToggleHistory}
                className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
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
                  placeholder={translate(locale, 'database', 'Reason', customTranslations)}
                  aria-label={translate(locale, 'database', 'Reason', customTranslations)}
                  value={form.reason}
                  onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="text-xs bg-black/45 border border-white/10 px-1 py-0.5 h-6 rounded w-32 text-white mr-1"
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleSave}
                  className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer"
                  title={translate(locale, 'common', 'Save', customTranslations)}
                  aria-label={translate(locale, 'common', 'Save', customTranslations)}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onCancelEdit}
                  className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer"
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
                  onClick={onStartEdit}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                  title={translate(locale, 'common', 'Edit', customTranslations)}
                  aria-label={translate(locale, 'common', 'Edit', customTranslations)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onDelete}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                  title={translate(locale, 'common', 'Delete', customTranslations)}
                  aria-label={translate(locale, 'common', 'Delete', customTranslations)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

      {showHistory && l.editHistory && (
        <TableRow>
          <TableCell colSpan={7} className="py-3 px-5 bg-black/20 border-b border-white/5 rounded-b-2xl">
            <div className="flex flex-col gap-1 border-l-2 border-teal-500 pl-4 py-1 text-left">
              <Overline className="text-teal-400 flex items-center gap-1.5">
                <History className="w-3" /> {translate(locale, 'database', 'AuditTrail', customTranslations)}
              </Overline>
              {l.editHistory.map((h, hIdx) => (
                <Caption key={hIdx} size="xs" className="text-muted-foreground mt-1 leading-relaxed block">
                  <span>[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                  {translate(locale, 'database', 'StartTime', customTranslations)} <strong className="text-foreground">"{h.prevStartTime}"</strong>, {translate(locale, 'database', 'EndTime', customTranslations)} <strong className="text-foreground">"{h.prevEndTime || translate(locale, 'common', 'No', customTranslations)}"</strong>, {translate(locale, 'database', 'Note', customTranslations)} <strong className="text-foreground">"{h.prevNote}"</strong> &rarr;{' '}
                  {translate(locale, 'database', 'Reason', customTranslations)} <em className="text-teal-300">"{h.reason}"</em>
                </Caption>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
