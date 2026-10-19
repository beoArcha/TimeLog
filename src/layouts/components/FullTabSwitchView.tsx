import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FullLayoutBuilder from '../builders/FullLayoutBuilder';
import CliInterface from '@features/cli/CliInterface';
import DbExplorer from '@features/db-explorer/DbExplorer';
import BackupTab from '@features/settings/BackupTab';
import SettingsTab from '@features/settings/SettingsTab';
import ManualTab from '@features/settings/ManualTab';
import CreditsTab from '@features/settings/CreditsTab';
import { GuiState } from '../hooks/useGuiLogic';

export interface FullTabSwitchViewProps {
  activeLargeTab: 'main' | 'reports' | 'db' | 'options' | 'backup' | 'cli' | 'manual' | 'credits';
  guiState: GuiState;
  sharedProps: {
    isCompactExpanded: boolean;
    setIsCompactExpanded: (v: boolean) => void;
    showToast: (msg: string) => void;
    handleMinimizeToTray: () => void;
    setLayoutVariant: (v: 'compact' | 'medium' | 'full') => void;
    currentProjectId: string | null;
    lastNonCompactVariant: 'medium' | 'full';
    alwaysOnTopSmall: boolean;
    setAlwaysOnTopSmall: (v: boolean) => void;
    dockPosition: 'right' | 'left';
    onToggleDock: () => void;
  };
}

export const FullTabSwitchView: React.FC<FullTabSwitchViewProps> = ({
  activeLargeTab,
  guiState,
  sharedProps,
}) => {
  return (
    <AnimatePresence mode="wait">
      {activeLargeTab === 'main' && (
        <motion.div key="large-tab-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-0">
          <FullLayoutBuilder
            state={guiState}
            {...sharedProps}
          />
        </motion.div>
      )}

      {activeLargeTab === 'cli' && (
        <motion.div key="large-tab-cli" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-0 flex-1 flex flex-col min-h-0">
          <CliInterface />
        </motion.div>
      )}

      {activeLargeTab === 'reports' && (
        <motion.div key="large-tab-reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-0">
          <FullLayoutBuilder
            state={guiState}
            {...sharedProps}
          />
        </motion.div>
      )}

      {activeLargeTab === 'db' && (
        <motion.div key="large-tab-db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-0">
          <DbExplorer />
        </motion.div>
      )}

      {activeLargeTab === 'backup' && (
        <motion.div key="large-tab-backup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-0">
          <BackupTab />
        </motion.div>
      )}

      {activeLargeTab === 'options' && (
        <motion.div key="large-tab-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-0">
          <SettingsTab />
        </motion.div>
      )}

      {activeLargeTab === 'manual' && (
        <motion.div key="large-tab-manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-0">
          <ManualTab />
        </motion.div>
      )}

      {activeLargeTab === 'credits' && (
        <motion.div key="large-tab-credits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-0">
          <CreditsTab />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
