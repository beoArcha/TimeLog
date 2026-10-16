import React, { useState, useId } from 'react';
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
import { HelpCircle, type LucideIcon } from 'lucide-react';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import { cn } from '@/lib/utils';

export interface PromptDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputAriaLabel?: string;
  icon?: LucideIcon | React.ElementType;
  onConfirm: (value: string) => void | Promise<void>;
  onCancel?: () => void;
  validate?: (value: string) => string | null | undefined;
}

interface PromptDialogFormProps extends Omit<PromptDialogProps, 'open' | 'onOpenChange'> {
  key?: React.Key;
  onClose: () => void;
}

function PromptDialogForm({
  title,
  description,
  defaultValue = '',
  placeholder,
  confirmLabel,
  cancelLabel,
  inputAriaLabel,
  icon: Icon = HelpCircle,
  onConfirm,
  onCancel,
  validate,
  onClose,
}: PromptDialogFormProps) {
  const { locale, customTranslations } = useSafeLocale();
  const inputId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();

  const resolvedConfirmLabel = confirmLabel || translate(locale, 'common', 'Save', customTranslations);
  const resolvedCancelLabel = cancelLabel || translate(locale, 'common', 'Cancel', customTranslations);

  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const result = onConfirm(value);
    if (result && typeof (result as Promise<void>).then === 'function') {
      setLoading(true);
      (result as Promise<void>).finally(() => {
        setLoading(false);
        onClose();
      });
    } else {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <DialogHeader className="flex flex-row items-center gap-3 space-y-0">
        <div
          className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0"
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1 text-left">
          <DialogTitle id={titleId}>{title}</DialogTitle>
          {description && (
            <DialogDescription id={descriptionId}>{description}</DialogDescription>
          )}
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-1.5 my-2">
        <Label htmlFor={inputId} className="sr-only">
          {inputAriaLabel || (typeof title === 'string' ? title : resolvedConfirmLabel)}
        </Label>
        <Input
          id={inputId}
          data-testid="prompt-dialog-input"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          autoFocus
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-errormessage={error ? errorId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(error && 'border-destructive focus-visible:ring-destructive')}
        />
        {error && (
          <span id={errorId} role="alert" className="text-xs text-destructive font-medium">
            {error}
          </span>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          data-testid="prompt-dialog-cancel-btn"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
        >
          {resolvedCancelLabel}
        </Button>
        <Button
          type="submit"
          data-testid="prompt-dialog-confirm-btn"
          loading={loading}
          aria-busy={loading}
          onClick={handleSubmit}
        >
          {resolvedConfirmLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Modal prompt dialog for capturing user text input with validation.
 */
export function PromptDialog({
  open,
  onOpenChange,
  ...formProps
}: PromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md focus-visible:outline-none">
        {open && (
          <PromptDialogForm
            key={String(open) + (formProps.defaultValue ?? '')}
            {...formProps}
            onClose={() => onOpenChange?.(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PromptDialog;
