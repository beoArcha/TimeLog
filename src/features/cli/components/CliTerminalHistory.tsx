import React from 'react';
import { TerminalLine } from '../types';

export interface CliTerminalHistoryProps {
  history: TerminalLine[];
  historyRef: React.RefObject<HTMLDivElement | null>;
}

export const CliTerminalHistory: React.FC<CliTerminalHistoryProps> = ({
  history,
  historyRef,
}) => {
  return (
    <div
      id="terminal-history"
      ref={historyRef}
      role="log"
      aria-live="polite"
      aria-label="CLI terminal history"
      className="rounded-2xl p-4 flex-1 min-h-[220px] overflow-y-auto font-mono text-xs leading-relaxed flex flex-col gap-1.5 focus:outline-none border border-[var(--code-border)] bg-[var(--code-bg)] text-[var(--code-foreground)] shadow-inner"
    >
      {history.map((line, index) => {
        let colorClass = 'text-slate-300';
        if (line.type === 'input') {
          colorClass = 'text-white font-bold border-l-2 border-l-orange-500 pl-1.5 my-1';
        } else if (line.type === 'error') {
          colorClass = 'text-rose-450 font-semibold bg-rose-500/10 p-1.5 rounded-lg';
        } else if (line.type === 'success') {
          colorClass = 'text-orange-400 font-semibold';
        } else if (line.type === 'info') {
          colorClass = 'text-teal-400';
        }

        return (
          <div key={index} className={`${colorClass} whitespace-pre-wrap`}>
            {line.text}
          </div>
        );
      })}
    </div>
  );
};
