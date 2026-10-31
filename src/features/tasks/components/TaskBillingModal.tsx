import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { useTranslation } from '@common/i18n/translator';
import { Task } from '@bindings/Task';

export interface TaskBillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSaveRate: (hourlyRate: string | null) => void;
}

export function TaskBillingModal({
  open,
  onOpenChange,
  task,
  onSaveRate,
}: TaskBillingModalProps) {
  const { t: tTask } = useTranslation('task');
  const { t: tCommon } = useTranslation('common');

  // Determine initial mode
  const getInitialMode = (): 'inherit' | 'non_billable' | 'custom' => {
    if (task.hourlyRate === null || task.hourlyRate === undefined) {
      return 'inherit';
    }
    const trimmed = task.hourlyRate.trim();
    if (trimmed === '0' || trimmed === '0.00') {
      return 'non_billable';
    }
    return 'custom';
  };

  const [mode, setMode] = useState<'inherit' | 'non_billable' | 'custom'>(getInitialMode);
  const [customRate, setCustomRate] = useState<string>(
    task.hourlyRate && task.hourlyRate !== '0' && task.hourlyRate !== '0.00'
      ? task.hourlyRate
      : ''
  );

  const handleSave = () => {
    if (mode === 'inherit') {
      onSaveRate(null);
    } else if (mode === 'non_billable') {
      onSaveRate('0.00');
    } else {
      onSaveRate(customRate.trim() || null);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            {tTask('ConfigureRate')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 my-2">
          <div className="text-sm font-medium text-foreground">
            {task.name}
          </div>

          <RadioGroup
            value={mode}
            onValueChange={(val) => setMode(val as 'inherit' | 'non_billable' | 'custom')}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inherit" id="rate-mode-inherit" data-testid="rate-mode-inherit" />
              <Label htmlFor="rate-mode-inherit" className="cursor-pointer text-sm font-normal">
                {tTask('RateInherit')}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="non_billable" id="rate-mode-non-billable" data-testid="rate-mode-non-billable" />
              <Label htmlFor="rate-mode-non-billable" className="cursor-pointer text-sm font-normal">
                {tTask('RateNonBillable')}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="rate-mode-custom" data-testid="rate-mode-custom" />
              <Label htmlFor="rate-mode-custom" className="cursor-pointer text-sm font-normal">
                {tTask('RateCustom')}
              </Label>
            </div>
          </RadioGroup>

          {mode === 'custom' && (
            <div className="mt-2 pl-6">
              <Label htmlFor="task-custom-rate-input" className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                {tTask('Rate')}
              </Label>
              <Input
                id="task-custom-rate-input"
                data-testid="task-custom-rate-input"
                type="text"
                placeholder={tTask('RatePlaceholder')}
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tCommon('Cancel')}
          </Button>
          <Button
            id="save-task-rate-btn"
            data-testid="save-task-rate-btn"
            type="button"
            variant="accent"
            onClick={handleSave}
          >
            {tCommon('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
