import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <AnimatePresence>
      {isDrawerOpen && (
        <div id="cli-drawer-wrapper" className="fixed inset-0 z-50 flex flex-col justify-start pointer-events-auto">
          {/* Backdrop overlay */}
          <motion.div
            id="cli-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
          />

          {/* Drawer content sliding down from the top */}
          <motion.div
            id="cli-drawer-container"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '-100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-50 w-full max-h-[82vh] flex flex-col bg-card/95 backdrop-blur-xl border-b border-border shadow-2xl p-4 sm:p-6 text-foreground overflow-hidden"
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
              />
            </div>

            <div className="pt-1">
              <CliQuickShortcuts
                onExecute={executeCommand}
                title={quickShortcutsTitle}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CliDrawer;
