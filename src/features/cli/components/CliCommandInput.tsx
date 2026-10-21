import React from 'react';
import { Send } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';

export interface CliCommandInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  submitLabel: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const CliCommandInput: React.FC<CliCommandInputProps> = ({
  input,
  setInput,
  onSubmit,
  placeholder,
  submitLabel,
  onKeyDown,
}) => {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 p-1.5 rounded-2xl border border-border bg-muted/40 transition-all">
      <span className="text-orange-500 font-mono text-sm self-center pl-2 font-bold select-none">
        oxyflow&gt;
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
        className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md h-auto"
      >
        {submitLabel} <Send className="w-3 h-3" />
      </Button>
    </form>
  );
};
