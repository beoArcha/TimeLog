import { useState } from 'react';
import { Edit3, Trash2, Check, X, History, AlertCircle } from 'lucide-react';
import { TimeLog } from '@bindings/TimeLog';
import { translate } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import { TableRow, TableCell } from '@components/ui/table';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Caption, Overline } from '@components/ui/typography';
import { Alert, AlertDescription } from '@components/ui/alert';
import { cn } from '@/lib/utils';

interface TimeLogTableRowProps {
  key?: string | number;
  l: TimeLog;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (startTime: string, endTime: string, note: string, reason: string) => void | Promise<boolean | void>;
  onCancelEdit: () => void;
  onDelete: () => void;
  locale: Locale;
  customTranslations: Record<string, unknown>;
  showHistory: boolean;
  onToggleHistory: () => void;
  errorMessage?: string | null;
}

function resolveErrorMessage(
  err: unknown,
  locale: Locale,
  customTranslations: Record<string, unknown>
): string {
  if (!err) {
    return translate(locale, 'database', 'SyncErrorReason', customTranslations);
  }

  let raw: string;
  if (err instanceof Error) {
    raw = err.message;
  } else if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    raw = (err as { message: string }).message;
  } else {
    raw = String(err);
  }

  if (raw.includes('ERR_AUDIT_REASON_REQUIRED')) {
    return translate(locale, 'common', 'ERR_AUDIT_REASON_REQUIRED', customTranslations);
  }
  if (raw.includes('ERR_AUDIT_SOURCE_INVALID')) {
    return translate(locale, 'common', 'ERR_AUDIT_SOURCE_INVALID', customTranslations);
  }
  if (raw.includes('ERR_TIMELOG_INVALID_RANGE')) {
    return translate(locale, 'common', 'ERR_TIMELOG_INVALID_RANGE', customTranslations);
  }
  if (raw.includes('ERR_REPOSITORY_SYNC') || raw.toLowerCase().includes('sync')) {
    return translate(locale, 'database', 'SyncErrorReason', customTranslations);
  }

  return raw || translate(locale, 'common', 'ErrGeneric', customTranslations);
}

function resolveAuditSourceLabel(
  source: string,
  locale: Locale,
  customTranslations: Record<string, unknown>
): string {
  switch (source) {
    case 'GUI Edit':
    case 'GuiEdit':
      return translate(locale, 'database', 'AuditSourceGuiEdit', customTranslations);
    case 'CLI Edit':
    case 'CliEdit':
      return translate(locale, 'database', 'AuditSourceCliEdit', customTranslations);
    case 'Manual Adjustment':
    case 'ManualAdjustment':
      return translate(locale, 'database', 'AuditSourceManualAdjustment', customTranslations);
    case 'System Patch':
    case 'SystemPatch':
      return translate(locale, 'database', 'AuditSourceSystemPatch', customTranslations);
    default:
      return source;
  }
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
  onToggleHistory,
  errorMessage
}: TimeLogTableRowProps) {
  const [form, setForm] = useState({
    startTime: l.startTime,
    endTime: l.endTime || '',
    note: l.note || '',
    reason: ''
  });
  const [reasonError, setReasonError] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [prevIsEditing, setPrevIsEditing] = useState(isEditing);

  if (prevIsEditing !== isEditing) {
    setPrevIsEditing(isEditing);
    setReasonError(false);
    setRowError(null);
    setForm({
      startTime: l.startTime,
      endTime: l.endTime || '',
      note: l.note || '',
      reason: ''
    });
  }

  const activeError = errorMessage ?? rowError;

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

  const handleSave = async () => {
    const trimmedReason = form.reason.trim();
    if (!trimmedReason) {
      setReasonError(true);
      return;
    }
    setReasonError(false);
    setRowError(null);
    try {
      const result = await onSaveEdit(form.startTime, form.endTime, form.note, trimmedReason);
      if (result === false) {
        setRowError(translate(locale, 'database', 'SyncErrorReason', customTranslations));
      }
    } catch (err) {
      setRowError(resolveErrorMessage(err, locale, customTranslations));
    }
  };

  const handleCancel = () => {
    setReasonError(false);
    setRowError(null);
    setForm({
      startTime: l.startTime,
      endTime: l.endTime || '',
      note: l.note || '',
      reason: ''
    });
    onCancelEdit();
  };

  const handleStart = () => {
    setReasonError(false);
    setRowError(null);
    setForm({
      startTime: l.startTime,
      endTime: l.endTime || '',
      note: l.note || '',
      reason: ''
    });
    onStartEdit();
  };

  return (
    <>
      <TableRow className="border-b border-border hover:bg-muted/50 text-left">
        <TableCell className="py-3.5 px-4 font-bold text-muted-foreground">{l.id}</TableCell>
        <TableCell className="py-3.5 px-4 text-primary font-bold">{l.taskId}</TableCell>
        <TableCell className="py-3.5 px-4">
          {isEditing ? (
            <Input
              type="text"
              value={form.startTime}
              onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
              className="bg-background border border-border px-2 py-1 h-7 rounded text-foreground"
              aria-label={translate(locale, 'database', 'StartTime', customTranslations)}
            />
          ) : (
            <span className="text-success font-semibold">{l.startTime}</span>
          )}
        </TableCell>
        <TableCell className="py-3.5 px-4">
          {isEditing ? (
            <Input
              type="text"
              value={form.endTime}
              onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
              className="bg-background border border-border px-2 py-1 h-7 rounded text-foreground"
              placeholder={translate(locale, 'database', 'EndTime', customTranslations)}
              aria-label={translate(locale, 'database', 'EndTime', customTranslations)}
            />
          ) : (
            <span className="text-foreground font-semibold">{l.endTime || translate(locale, 'database', 'TrackingActiveLabel', customTranslations)}</span>
          )}
        </TableCell>
        <TableCell className="py-3.5 px-4 truncate max-w-xs">
          {isEditing ? (
            <Input
              type="text"
              value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
              className="bg-background border border-border px-2 py-1 h-7 rounded text-foreground"
              aria-label={translate(locale, 'database', 'Note', customTranslations)}
            />
          ) : (
            <span>{l.note || <span className="text-muted-foreground italic">{translate(locale, 'database', 'NoNote', customTranslations)}</span>}</span>
          )}
        </TableCell>
        <TableCell className="py-3.5 px-4">
          {hasHistory ? (
            <Badge variant="amber" size="sm" className="w-max">
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
                  placeholder={translate(locale, 'database', 'Reason', customTranslations)}
                  aria-label={translate(locale, 'database', 'Reason', customTranslations)}
                  value={form.reason}
                  onChange={e => {
                    const nextReason = e.target.value;
                    setForm(prev => ({ ...prev, reason: nextReason }));
                    if (nextReason.trim()) {
                      setReasonError(false);
                    }
                  }}
                  aria-invalid={reasonError ? 'true' : undefined}
                  className={cn(
                    'text-xs bg-background border px-1.5 py-0.5 h-6 rounded w-32 text-foreground mr-1',
                    reasonError ? 'border-destructive ring-1 ring-destructive/40' : 'border-border'
                  )}
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleSave}
                  className="p-1.5 rounded-lg bg-success/20 hover:bg-success/30 text-success cursor-pointer"
                  title={translate(locale, 'common', 'Save', customTranslations)}
                  aria-label={translate(locale, 'common', 'Save', customTranslations)}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCancel}
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
                  onClick={handleStart}
                  className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground cursor-pointer"
                  title={translate(locale, 'common', 'Edit', customTranslations)}
                  aria-label={translate(locale, 'common', 'Edit', customTranslations)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onDelete}
                  className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive cursor-pointer"
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

      {isEditing && activeError && (
        <TableRow className="bg-destructive/5 border-b border-border">
          <TableCell colSpan={7} className="py-2 px-4">
            <Alert
              variant="destructive"
              aria-live="polite"
              className="py-1.5 px-3 text-xs flex items-center gap-2"
              data-testid="time-log-row-error"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <AlertDescription className="text-xs leading-none">
                {activeError}
              </AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      )}

      {showHistory && l.editHistory && (
        <TableRow>
          <TableCell colSpan={7} className="py-3 px-5 bg-muted/30 border-b border-border rounded-b-2xl">
            <div className="flex flex-col gap-1 border-l-2 border-primary pl-4 py-1 text-left">
              <Overline className="text-primary flex items-center gap-1.5">
                <History className="w-3" /> {translate(locale, 'database', 'AuditTrail', customTranslations)}
              </Overline>
              {l.editHistory.map((h, hIdx) => (
                <Caption key={hIdx} size="xs" className="text-muted-foreground mt-1 leading-relaxed block">
                  <span>[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                  {h.auditSource && (
                    <Badge
                      variant="outline"
                      size="sm"
                      data-testid="audit-source-badge"
                      className="mr-1.5 font-mono text-[10px] py-0 px-1.5 align-middle"
                    >
                      {translate(locale, 'database', 'AuditSourceLabel', customTranslations)} {resolveAuditSourceLabel(h.auditSource, locale, customTranslations)}
                    </Badge>
                  )}
                  {translate(locale, 'database', 'StartTime', customTranslations)} <strong className="text-foreground">"{h.prevStartTime}"</strong>, {translate(locale, 'database', 'EndTime', customTranslations)} <strong className="text-foreground">"{h.prevEndTime || translate(locale, 'common', 'No', customTranslations)}"</strong>, {translate(locale, 'database', 'Note', customTranslations)} <strong className="text-foreground">"{h.prevNote}"</strong> &rarr;{' '}
                  {translate(locale, 'database', 'Reason', customTranslations)} <em className="text-foreground">"{h.reason}"</em>
                </Caption>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
