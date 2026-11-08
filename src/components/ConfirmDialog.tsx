import React, { useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { IconBox } from '@components/ui/icon-box';
import { VStack } from '@components/ui/stack';
import { AlertTriangle, HelpCircle, type LucideIcon } from 'lucide-react';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';

const TECHNICAL_ERROR_PATTERNS = [
  /\bat\s+/i,
  /\n\s*at\s+/i,
  /sqlite/i,
  /SQLITE_/i,
  /panic/i,
];

function isUnsafeErrorMessage(msg: string): boolean {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(msg));
}

function extractRawErrorMessage(error: unknown): string | null {
  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (error instanceof Error) {
    const trimmed = error.message.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof error === 'object' && error !== null) {
    const candidate = (error as Record<string, unknown>).message;
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }
  return null;
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: LucideIcon | React.ElementType;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
}

interface CancellableEventDetails {
  cancel: () => void;
}

function isCancellableEventDetails(details: unknown): details is CancellableEventDetails {
  if (typeof details !== 'object' || details === null) {
    return false;
  }
  return 'cancel' in details && typeof (details as { cancel?: unknown }).cancel === 'function';
}

/**
 * Confirmation dialog for user actions such as deletions, resets, or critical operations.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  icon: IconProp,
  onConfirm,
  onCancel,
  loading = false,
  confirmDisabled = false,
  errorMessage,
  onClearError,
}: ConfirmDialogProps) {
  const { locale, customTranslations } = useSafeLocale();
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const isLoading = loading || internalLoading;
  const displayError = errorMessage ?? internalError;

  const titleId = useId();
  const descriptionId = useId();

  const resolvedConfirmLabel = confirmLabel || translate(locale, 'common', 'Confirm', customTranslations);
  const resolvedCancelLabel = cancelLabel || translate(locale, 'common', 'Cancel', customTranslations);

  const Icon = IconProp || (variant === 'destructive' || variant === 'warning' ? AlertTriangle : HelpCircle);

  const clearError = () => {
    setInternalError(null);
    onClearError?.();
  };

  const handleCancel = () => {
    if (isLoading) {
      return;
    }
    clearError();
    onCancel?.();
    onOpenChange?.(false);
  };

  const handleOpenChange = (nextOpen: boolean, eventDetails?: unknown) => {
    if (isLoading && !nextOpen) {
      if (isCancellableEventDetails(eventDetails)) {
        eventDetails.cancel();
      }
      return;
    }

    if (!nextOpen) {
      clearError();
    }
    onOpenChange?.(nextOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isLoading && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const extractErrorMessage = (error: unknown): string => {
    const rawMessage = extractRawErrorMessage(error);
    const genericFallback = translate(locale, 'common', 'ErrGeneric', customTranslations);

    if (!rawMessage || isUnsafeErrorMessage(rawMessage)) {
      return genericFallback;
    }

    return rawMessage;
  };

  const handleConfirm = () => {
    if (isLoading || confirmDisabled) {
      return;
    }

    try {
      const result = onConfirm();
      const isPromise = Boolean(result && typeof (result as Promise<void>).then === 'function');
      if (isPromise) {
        setInternalLoading(true);
        (result as Promise<void>)
          .then(() => {
            clearError();
            onOpenChange?.(false);
          })
          .catch((error) => {
            console.error('[ConfirmDialog] Confirm action failed:', error);
            setInternalError(extractErrorMessage(error));
          })
          .finally(() => {
            setInternalLoading(false);
          });
        return;
      }

      clearError();
      onOpenChange?.(false);
    } catch (error) {
      console.error('[ConfirmDialog] Confirm action failed:', error);
      setInternalError(extractErrorMessage(error));
    }
  };

  const iconColorMap: Record<string, string> = {
    destructive: 'text-destructive bg-destructive/10 border-destructive/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
  };
  const iconColor = iconColorMap[variant] ?? 'text-primary bg-primary/10 border-primary/20';

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={isLoading}
    >
      <DialogContent
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={handleKeyDown}
        showClose={!isLoading}
        className="max-w-md focus-visible:outline-none"
      >
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0">
          <IconBox aria-hidden="true" size="md" rounded="section" className={iconColor}>
            <Icon className="w-5 h-5" />
          </IconBox>
          <VStack gap="2xs" className="text-left">
            <DialogTitle id={titleId}>{title}</DialogTitle>
            {description && (
              <DialogDescription id={descriptionId}>{description}</DialogDescription>
            )}
          </VStack>
        </DialogHeader>

        {children && <div className="py-2">{children}</div>}

        {displayError && (
          <div
            role="alert"
            data-testid="confirm-dialog-error"
            className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 my-2"
          >
            {displayError}
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            autoFocus={variant === 'destructive'}
            data-testid="confirm-dialog-cancel-btn"
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading || confirmDisabled}
            focusableWhenDisabled={isLoading}
            loading={isLoading}
            aria-busy={isLoading}
            data-testid="confirm-dialog-confirm-btn"
          >
            {resolvedConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
