import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Form } from '@components/ui/form';
import { cn } from '@/lib/utils';

export interface CliCommandInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  submitLabel: string;
  isSandbox?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const CliCommandInput: React.FC<CliCommandInputProps> = ({
  input,
  setInput,
  onSubmit,
  placeholder,
  submitLabel,
  isSandbox = false,
  onKeyDown,
}) => {
  const formBorderClass = isSandbox
    ? 'border-amber-500/30 bg-amber-500/5 focus-within:border-amber-500/60'
    : 'border-border bg-muted/40 focus-within:border-primary/50';

  const promptColorClass = isSandbox
    ? 'text-amber-500'
    : 'text-orange-500';

  const buttonGradientClass = isSandbox
    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
    : 'bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600';

  return (
    <Form
      layout="horizontal"
      gap="xs"
      onSubmit={onSubmit}
      className={cn('p-1.5 rounded-2xl border transition-all', formBorderClass)}
    >
      <span id="cli-prompt-label" className={`${promptColorClass} font-mono text-sm self-center pl-2 font-bold select-none`}>
        {isSandbox ? 'oxyflow@emulator>' : 'oxyflow>'}
      </span>
      <Input
        id="cli-input-field"
        type="text"
        className="flex-1 bg-transparent font-mono text-xs border-none outline-none focus-visible:ring-0 shadow-none py-2 h-auto text-foreground placeholder:text-muted-foreground"
        placeholder={placeholder}
        aria-label={placeholder}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
      />
      <Button
        id="cli-submit-btn"
        type="submit"
        aria-label={submitLabel}
        className={`${buttonGradientClass} text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md h-auto`}
      >
        {submitLabel} <Send className="w-3 h-3" />
      </Button>
    </Form>
  );
};
