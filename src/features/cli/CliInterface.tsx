import React from 'react';
import { CliEngineContext } from './types';
import { useCliOrchestrator } from './hooks/useCliOrchestrator';
import { CliHeader } from './components/CliHeader';
import { CliTerminalHistory } from './components/CliTerminalHistory';
import { CliCommandInput } from './components/CliCommandInput';
import { CliQuickShortcuts } from './components/CliQuickShortcuts';

export default function CliInterface(props?: Partial<CliEngineContext>) {
  const {
    input,
    setInput,
    history,
    historyRef,
    executeCommand,
    handleFormSubmit,
    placeholder,
    submitLabel,
    quickShortcutsTitle,
    isSandbox,
  } = useCliOrchestrator(props);

  return (
    <div
      id="cli-interface"
      className="flex-1 min-h-0 flex flex-col gap-4 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-border bg-card text-foreground shadow-2xl relative transition-all duration-300"
    >
      <CliHeader isSandbox={isSandbox} />

      <CliTerminalHistory
        history={history}
        historyRef={historyRef}
      />

      <CliCommandInput
        input={input}
        setInput={setInput}
        onSubmit={handleFormSubmit}
        placeholder={placeholder}
        submitLabel={submitLabel}
      />

      <CliQuickShortcuts
        onExecute={executeCommand}
        title={quickShortcutsTitle}
      />
    </div>
  );
}
