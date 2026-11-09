import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Textarea } from '@components/ui/textarea';
import { VStack, HStack } from '@components/ui/stack';
import { Badge } from '@components/ui/badge';
import { Caption, MonoText, Text } from '@components/ui/typography';
import { useTranslation } from '@common/i18n/translator';
import { useDataSafe } from '@common/hooks/DataContext';
import { TimeLog } from '@bindings/TimeLog';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Edit3, AlertCircle } from 'lucide-react';

const KNOWN_CODES = [
  'ERR_AUDIT_REASON_REQUIRED',
  'ERR_TIMELOG_INVALID_RANGE',
  'ERR_AUDIT_SOURCE_INVALID',
] as const;

function matchEngineErrorCode(text: string): string | undefined {
  return KNOWN_CODES.find((code) => text.includes(code));
}

function extractCauseCode(cause: unknown): string | undefined {
  if (typeof cause !== 'object' || cause === null) {
    return undefined;
  }
  const code = (cause as Record<string, unknown>).code;
  return typeof code === 'string' ? code : undefined;
}

function extractErrorCode(err: unknown): string | undefined {
  if (!err) {
    return undefined;
  }

  if (typeof err === 'string') {
    return matchEngineErrorCode(err);
  }

  if (typeof err !== 'object' || err === null) {
    return undefined;
  }

  const errorObj = err as Record<string, unknown>;
  if (typeof errorObj.code === 'string') {
    return errorObj.code;
  }

  const causeCode = extractCauseCode(errorObj.cause);
  if (causeCode) {
    return causeCode;
  }

  if (typeof errorObj.message === 'string') {
    return matchEngineErrorCode(errorObj.message);
  }

  return undefined;
}

export interface ReportLogEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: TimeLog | ClampedTimeLog | null;
  projectName?: string;
  taskName?: string;
  onSaveSuccess?: (updatedLogId: string) => void;
  onDeleteSuccess?: (deletedLogId: string) => void;
}

interface ReportLogEditFormProps {
  key?: React.Key;
  log: TimeLog | ClampedTimeLog;
  projectName?: string;
  taskName?: string;
  onClose: () => void;
  onSaveSuccess?: (updatedLogId: string) => void;
  onDeleteSuccess?: (deletedLogId: string) => void;
}

function ReportLogEditForm({
  log,
  projectName,
  taskName,
  onClose,
  onSaveSuccess,
  onDeleteSuccess,
}: ReportLogEditFormProps) {
  const { t: tReport } = useTranslation('report');
  const { t: tCommon } = useTranslation('common');
  const { t: tEngine } = useTranslation('engine');
  const dataContext = useDataSafe();

  const [startTime, setStartTime] = useState<string>(log.startTime || '');
  const [endTime, setEndTime] = useState<string>(log.endTime || '');
  const [note, setNote] = useState<string>(log.note || '');
  const [reason, setReason] = useState<string>('');
  const [reasonError, setReasonError] = useState<boolean>(false);
  const [reasonErrorMessage, setReasonErrorMessage] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<boolean>(false);
  const [rangeErrorMessage, setRangeErrorMessage] = useState<string | null>(null);
  const [generalErrorMessage, setGeneralErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async () => {
    if (isSaving || isDeleting) return;
    setIsDeleting(true);
    setGeneralErrorMessage(null);

    try {
      if (!dataContext?.handleDeleteTimeLog) {
        throw new Error('Time log deletion is unavailable outside DataContext');
      }

      const result = await dataContext.handleDeleteTimeLog(log.id);
      if (!result.deleted) {
        setGeneralErrorMessage(tEngine('SyncStatusError'));
        setIsDeleting(false);
        return;
      }

      if (onDeleteSuccess) {
        onDeleteSuccess(log.id);
      } else {
        onSaveSuccess?.(log.id);
      }
      onClose();
    } catch (err) {
      console.error('[ReportLogEditModal] Deletion failed:', err);
      setGeneralErrorMessage(tEngine('SyncStatusError'));
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setReasonError(false);
    setReasonErrorMessage(null);
    setRangeError(false);
    setRangeErrorMessage(null);
    setGeneralErrorMessage(null);

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setReasonError(true);
      setReasonErrorMessage(tReport('ERR_AUDIT_REASON_REQUIRED'));
      return;
    }

    const startTimestamp = new Date(startTime).getTime();
    if (isNaN(startTimestamp)) {
      setRangeError(true);
      setRangeErrorMessage(tReport('ERR_TIMELOG_INVALID_RANGE'));
      return;
    }

    const trimmedEnd = endTime.trim();
    if (trimmedEnd) {
      const endTimestamp = new Date(trimmedEnd).getTime();
      if (isNaN(endTimestamp) || endTimestamp < startTimestamp) {
        setRangeError(true);
        setRangeErrorMessage(tReport('ERR_TIMELOG_INVALID_RANGE'));
        return;
      }
    }

    setIsSaving(true);

    if (!isSaved) {
      try {
        if (!dataContext?.handleEditTimeLog) {
          throw new Error('Time log editing is unavailable outside DataContext');
        }

        const result = await dataContext.handleEditTimeLog(
          log.id,
          log.taskId,
          startTime.trim(),
          trimmedEnd ? trimmedEnd : null,
          note.trim() ? note.trim() : null,
          trimmedReason
        );

        if (!result.saved) {
          setGeneralErrorMessage(tEngine('SyncStatusError'));
          setIsSaving(false);
          return;
        }

        // The edit is committed. Keep this flag even if synchronization failed,
        // so retrying the modal only refreshes state and never creates a second audit row.
        setIsSaved(true);

        if (!result.synchronized) {
          setGeneralErrorMessage(tEngine('SyncStatusError'));
          setIsSaving(false);
          return;
        }
      } catch (err) {
        console.error('[ReportLogEditModal] Mutation failed:', err);
        const code = extractErrorCode(err);
        if (code === 'ERR_AUDIT_REASON_REQUIRED') {
          setReasonError(true);
          setReasonErrorMessage(tReport('ERR_AUDIT_REASON_REQUIRED'));
        } else if (code === 'ERR_TIMELOG_INVALID_RANGE') {
          setRangeError(true);
          setRangeErrorMessage(tReport('ERR_TIMELOG_INVALID_RANGE'));
        } else if (code === 'ERR_AUDIT_SOURCE_INVALID') {
          setGeneralErrorMessage(tReport('ERR_AUDIT_SOURCE_INVALID'));
        } else {
          setGeneralErrorMessage(tEngine('SyncStatusError'));
        }
        setIsSaving(false);
        return;
      }
    } else {
      // A previous attempt committed the edit but failed while synchronizing state.
      // Retry only the refresh; never submit the same audit mutation twice.
      try {
        if (!dataContext?.refreshData) {
          throw new Error('Data refresh is unavailable outside DataContext');
        }
        const refreshed = await dataContext.refreshData();
        if (refreshed === false) {
          throw new Error('Repository state refresh did not complete');
        }
      } catch (refreshErr) {
        console.error('[ReportLogEditModal] Refresh after edit failed:', refreshErr);
        setGeneralErrorMessage(tEngine('SyncStatusError'));
        setIsSaving(false);
        return;
      }
    }

    onSaveSuccess?.(log.id);
    onClose();
    setIsSaving(false);
  };

  return (
    <DialogContent className="max-w-md bg-card border-border p-6 rounded-2xl shadow-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
          <Edit3 className="w-4 h-4 text-primary" />
          {tReport('TimeLogAuditModalTitle')}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {tReport('AuditReasonLabel')}
        </DialogDescription>
      </DialogHeader>

      <VStack gap="md" className="py-2">
        <HStack gap="sm" className="flex-wrap items-center">
          {taskName && (
            <Badge variant="orange" size="sm">
              {taskName}
            </Badge>
          )}
          {projectName && (
            <Caption className="text-muted-foreground font-medium">
              ({projectName})
            </Caption>
          )}
          <MonoText size="2xs" className="text-muted-foreground ml-auto">
            ID: {log.id}
          </MonoText>
        </HStack>

        <VStack gap="xs">
          <Label htmlFor="audit-edit-start-time" className="text-xs font-mono text-muted-foreground">
            {tReport('StartTime')}
          </Label>
          <Input
            id="audit-edit-start-time"
            data-testid="audit-edit-start-time"
            type="text"
            aria-invalid={rangeError ? 'true' : undefined}
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              setRangeError(false);
              setRangeErrorMessage(null);
              setIsSaved(false);
            }}
            className={`h-8 text-xs font-mono bg-background ${
              rangeError ? 'border-destructive focus-visible:ring-destructive' : ''
            }`}
          />
        </VStack>

        <VStack gap="xs">
          <Label htmlFor="audit-edit-end-time" className="text-xs font-mono text-muted-foreground">
            {tReport('EndTime')}
          </Label>
          <Input
            id="audit-edit-end-time"
            data-testid="audit-edit-end-time"
            type="text"
            aria-invalid={rangeError ? 'true' : undefined}
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              setRangeError(false);
              setRangeErrorMessage(null);
              setIsSaved(false);
            }}
            className={`h-8 text-xs font-mono bg-background ${
              rangeError ? 'border-destructive focus-visible:ring-destructive' : ''
            }`}
          />
          {rangeErrorMessage && (
            <HStack data-testid="audit-range-error" gap="xs" className="text-xs text-destructive items-center mt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <Text size="xs" className="text-destructive">{rangeErrorMessage}</Text>
            </HStack>
          )}
        </VStack>

        <VStack gap="xs">
          <Label htmlFor="audit-edit-note" className="text-xs font-mono text-muted-foreground">
            {tReport('Note')}
          </Label>
          <Input
            id="audit-edit-note"
            data-testid="audit-edit-note"
            type="text"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setIsSaved(false);
            }}
            className="h-8 text-xs bg-background"
          />
        </VStack>

        <VStack gap="xs">
          <Label htmlFor="audit-edit-reason" className="text-xs font-mono font-bold text-primary">
            * {tReport('AuditReasonLabel')}
          </Label>
          <Textarea
            id="audit-edit-reason"
            data-testid="audit-edit-reason"
            aria-invalid={reasonError ? 'true' : undefined}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(false);
              setReasonErrorMessage(null);
              setIsSaved(false);
            }}
            placeholder={tReport('AuditReasonPlaceholder')}
            rows={2}
            className={`text-xs bg-background resize-none ${
              reasonError
                ? 'border-destructive focus:border-destructive text-destructive'
                : 'border-primary/50 focus:border-primary'
            }`}
          />
          {reasonErrorMessage && (
            <HStack data-testid="audit-reason-error" gap="xs" className="text-xs text-destructive items-center mt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <Text size="xs" className="text-destructive">{reasonErrorMessage}</Text>
            </HStack>
          )}
        </VStack>

        {generalErrorMessage && (
          <HStack data-testid="audit-general-error" gap="xs" className="text-xs text-destructive items-center">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <Text size="xs" className="text-destructive">{generalErrorMessage}</Text>
          </HStack>
        )}
      </VStack>

      <DialogFooter className="gap-2 sm:gap-0 justify-between items-center w-full">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isSaving || isDeleting}
          data-testid="audit-delete-button"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto cursor-pointer"
        >
          {isDeleting ? tCommon('Delete') + '...' : tCommon('Delete')}
        </Button>
        <HStack gap="sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving || isDeleting}
          >
            {tCommon('Cancel')}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            data-testid="audit-save-button"
            className="gap-1.5"
          >
            {isSaving ? tCommon('Save') + '...' : tCommon('Save')}
          </Button>
        </HStack>
      </DialogFooter>
    </DialogContent>
  );
}

/**
 * Audit-compliant time log edit modal.
 * Requires a mandatory "Reason" field for every modification to enforce audit integrity.
 */
export function ReportLogEditModal({
  isOpen,
  onClose,
  log,
  projectName,
  taskName,
  onSaveSuccess,
  onDeleteSuccess,
}: ReportLogEditModalProps) {
  if (!isOpen || !log) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ReportLogEditForm
        key={log.id}
        log={log}
        projectName={projectName}
        taskName={taskName}
        onClose={onClose}
        onSaveSuccess={onSaveSuccess}
        onDeleteSuccess={onDeleteSuccess}
      />
    </Dialog>
  );
}

export default ReportLogEditModal;
