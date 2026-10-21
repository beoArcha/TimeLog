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
import { AlertTriangle, HelpCircle, type LucideIcon } from 'lucide-react';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: LucideIcon | React.ElementType;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

/**
 * Confirmation dialog for user actions such as deletions, resets, or critical operations.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  icon: IconProp,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const { locale, customTranslations } = useSafeLocale();
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = loading || internalLoading;

  const titleId = useId();
  const descriptionId = useId();

  const resolvedConfirmLabel = confirmLabel || translate(locale, 'common', 'Confirm', customTranslations);
  const resolvedCancelLabel = cancelLabel || translate(locale, 'common', 'Cancel', customTranslations);

  const Icon = IconProp || (variant === 'destructive' || variant === 'warning' ? AlertTriangle : HelpCircle);

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const handleConfirm = () => {
    const result = onConfirm();
    if (result && typeof (result as Promise<void>).then === 'function') {
      setInternalLoading(true);
      (result as Promise<void>).finally(() => {
        setInternalLoading(false);
        onOpenChange?.(false);
      });
    } else {
      onOpenChange?.(false);
    }
  };

  const iconColorMap: Record<string, string> = {
    destructive: 'text-destructive bg-destructive/10 border-destructive/20',
    warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };
  const iconColor = iconColorMap[variant] ?? 'text-primary bg-primary/10 border-primary/20';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="max-w-md focus-visible:outline-none"
      >
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className={cn('p-2.5 rounded-2xl border shrink-0', iconColor)} aria-hidden="true">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1 text-left">
            <DialogTitle id={titleId}>{title}</DialogTitle>
            {description && (
              <DialogDescription id={descriptionId}>{description}</DialogDescription>
            )}
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            autoFocus={variant === 'destructive'}
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            loading={isLoading}
            aria-busy={isLoading}
          >
            {resolvedConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
