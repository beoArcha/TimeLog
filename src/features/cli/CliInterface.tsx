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
    handleInputKeyDown,
    placeholder,
    submitLabel,
    quickShortcutsTitle,
    isSandbox,
    toggleSandbox,
  } = useCliOrchestrator(props);

  const containerBorderClass = isSandbox
    ? 'border-2 border-amber-500/40 ring-1 ring-amber-500/20'
    : 'border border-border';

  return (
    <div
      id="cli-interface"
      className={`flex-1 min-h-0 flex flex-col gap-4 backdrop-blur-md rounded-3xl p-4 sm:p-6 ${containerBorderClass} bg-card text-foreground shadow-2xl relative transition-all duration-300`}
    >
      <CliHeader isSandbox={isSandbox} onToggleSandbox={toggleSandbox} />

      <CliTerminalHistory
        history={history}
        historyRef={historyRef}
      />

      <CliCommandInput
        input={input}
        setInput={setInput}
        onSubmit={handleFormSubmit}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        submitLabel={submitLabel}
        isSandbox={isSandbox}
      />

      <CliQuickShortcuts
        onExecute={executeCommand}
        onSetInput={setInput}
        title={quickShortcutsTitle}
      />
    </div>
  );
}
