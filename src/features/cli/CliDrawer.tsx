import React from 'react';
import { AnimatedDrawer } from '@components/AnimatedDrawer';
import { useCliDrawer, UseCliDrawerProps } from './hooks/useCliDrawer';
import { CliDrawerHeader } from './components/CliDrawerHeader';
import { CliTerminalHistory } from './components/CliTerminalHistory';
import { CliCommandInput } from './components/CliCommandInput';
import { CliQuickShortcuts } from './components/CliQuickShortcuts';

export type CliDrawerProps = UseCliDrawerProps;

export const CliDrawer: React.FC<CliDrawerProps> = ({ onClose }) => {
  const {
    input,
    setInput,
    historyRef,
    isDrawerOpen,
    isSandbox,
    terminalHistory,
    executeCommand,
    handleClose,
    handleSubmit,
    handleInputKeyDown,
    title,
    closeLabel,
    liveBadge,
    sandboxBadge,
    placeholder,
    submitLabel,
    quickShortcutsTitle,
  } = useCliDrawer({ onClose });

  return (
    <AnimatedDrawer
      isOpen={isDrawerOpen}
      onClose={handleClose}
      title={title}
      wrapperId="cli-drawer-wrapper"
      backdropId="cli-drawer-backdrop"
      containerId="cli-drawer-container"
    >
      <CliDrawerHeader
        title={title}
        closeLabel={closeLabel}
        isSandbox={isSandbox}
        liveBadge={liveBadge}
        sandboxBadge={sandboxBadge}
        onClose={handleClose}
      />

      <div className="flex-1 min-h-[220px] max-h-[45vh] flex flex-col overflow-hidden mb-3">
        <CliTerminalHistory
          history={terminalHistory}
          historyRef={historyRef}
        />
      </div>

      <div className="mb-2">
        <CliCommandInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          submitLabel={submitLabel}
          isSandbox={isSandbox}
        />
      </div>

      <div className="pt-1">
        <CliQuickShortcuts
          onExecute={executeCommand}
          onSetInput={setInput}
          title={quickShortcutsTitle}
        />
      </div>
    </AnimatedDrawer>
  );
};

export default CliDrawer;
