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
import { Caption, MonoText } from '@components/ui/typography';
import { useTranslation } from '@common/i18n/translator';
import { EngineRouter } from '@common/engine/EngineRouter';
import { useDataSafe } from '@common/hooks/DataContext';
import { TimeLog } from '@bindings/TimeLog';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Edit3, AlertCircle } from 'lucide-react';

export interface ReportLogEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: TimeLog | ClampedTimeLog | null;
  projectName?: string;
  taskName?: string;
  onSaveSuccess?: (updatedLogId: string) => void;
}

interface ReportLogEditFormProps {
  key?: React.Key;
  log: TimeLog | ClampedTimeLog;
  projectName?: string;
  taskName?: string;
  onClose: () => void;
  onSaveSuccess?: (updatedLogId: string) => void;
}

function ReportLogEditForm({
  log,
  projectName,
  taskName,
  onClose,
  onSaveSuccess,
}: ReportLogEditFormProps) {
  const { t: tReport } = useTranslation('report');
  const { t: tCommon } = useTranslation('common');
  const dataContext = useDataSafe();

  const [startTime, setStartTime] = useState<string>(log.startTime || '');
  const [endTime, setEndTime] = useState<string>(log.endTime || '');
  const [note, setNote] = useState<string>(log.note || '');
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setErrorMessage(tReport('AuditReasonRequired'));
      return;
    }

    const startTimestamp = new Date(startTime).getTime();
    if (isNaN(startTimestamp)) {
      setErrorMessage(tCommon('ErrGeneric'));
      return;
    }

    const trimmedEnd = endTime.trim();
    if (trimmedEnd) {
      const endTimestamp = new Date(trimmedEnd).getTime();
      if (isNaN(endTimestamp)) {
        setErrorMessage(tCommon('ErrGeneric'));
        return;
      }
      if (endTimestamp < startTimestamp) {
        setErrorMessage(tCommon('ErrGeneric'));
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage(null);

    if (!isSaved) {
      try {
        await EngineRouter.getInstance().timeLogs.editTimeLog(
          log.id,
          log.taskId,
          startTime.trim(),
          trimmedEnd ? trimmedEnd : null,
          note.trim() ? note.trim() : null,
          trimmedReason
        );
        setIsSaved(true);
      } catch (err) {
        console.error('[ReportLogEditModal] Mutation failed:', err);
        setErrorMessage(tCommon('ErrGeneric'));
        setIsSaving(false);
        return;
      }
    }

    try {
      if (dataContext?.refreshData) {
        await dataContext.refreshData();
      }
      onSaveSuccess?.(log.id);
      onClose();
    } catch (refreshErr) {
      console.error('[ReportLogEditModal] Refresh after edit failed:', refreshErr);
      setErrorMessage(tCommon('ErrGeneric'));
    } finally {
      setIsSaving(false);
    }
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
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              setIsSaved(false);
            }}
            className="h-8 text-xs font-mono bg-background"
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
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              setIsSaved(false);
            }}
            className="h-8 text-xs font-mono bg-background"
          />
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
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setIsSaved(false);
            }}
            placeholder={tReport('AuditReasonPlaceholder')}
            rows={2}
            className="text-xs bg-background resize-none border-primary/50 focus:border-primary"
          />
        </VStack>

        {errorMessage && (
          <HStack gap="xs" className="text-xs text-destructive items-center">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </HStack>
        )}
      </VStack>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSaving}
        >
          {tCommon('Cancel')}
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !reason.trim()}
          data-testid="audit-save-button"
          className="gap-1.5"
        >
          {isSaving ? tCommon('Save') + '...' : tCommon('Save')}
        </Button>
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
      />
    </Dialog>
  );
}

export default ReportLogEditModal;
