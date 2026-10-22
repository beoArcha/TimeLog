import React from 'react';
import { AnimatePresence } from 'motion/react';
import { AnimatedFade } from '@components/AnimatedFade';
import FullLayoutBuilder from '../builders/FullLayoutBuilder';
import CliInterface from '@features/cli/CliInterface';
import DbExplorer from '@features/db-explorer/DbExplorer';
import BackupTab from '@features/settings/BackupTab';
import SettingsTab from '@features/settings/SettingsTab';
import ManualTab from '@features/settings/ManualTab';
import CreditsTab from '@features/settings/CreditsTab';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { AppTabId } from '@common/types/navigation';
import { GuiState } from '../hooks/useGuiLogic';

export interface FullTabSwitchViewProps {
  activeLargeTab: AppTabId;
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
  const { canInspectDatabase } = usePlatformCapabilities();

  return (
    <AnimatePresence mode="wait">
      {activeLargeTab === 'tasks' && (
        <AnimatedFade key="large-tab-tasks" className="w-full min-w-0">
          <FullLayoutBuilder
            state={guiState}
            {...sharedProps}
          />
        </AnimatedFade>
      )}

      {activeLargeTab === 'cli' && (
        <AnimatedFade key="large-tab-cli" className="w-full min-w-0 flex-1 flex flex-col min-h-0">
          <CliInterface />
        </AnimatedFade>
      )}

      {activeLargeTab === 'reports' && (
        <AnimatedFade key="large-tab-reports" className="w-full min-w-0">
          <FullLayoutBuilder
            state={guiState}
            {...sharedProps}
          />
        </AnimatedFade>
      )}

      {activeLargeTab === 'db' && canInspectDatabase && (
        <AnimatedFade key="large-tab-db" className="w-full min-w-0">
          <DbExplorer />
        </AnimatedFade>
      )}

      {activeLargeTab === 'backup' && (
        <AnimatedFade key="large-tab-backup" className="w-full min-w-0">
          <BackupTab />
        </AnimatedFade>
      )}

      {activeLargeTab === 'settings' && (
        <AnimatedFade key="large-tab-settings" className="w-full min-w-0">
          <SettingsTab />
        </AnimatedFade>
      )}

      {activeLargeTab === 'manual' && (
        <AnimatedFade key="large-tab-manual" className="w-full min-w-0">
          <ManualTab />
        </AnimatedFade>
      )}

      {activeLargeTab === 'credits' && (
        <AnimatedFade key="large-tab-credits" className="w-full min-w-0">
          <CreditsTab />
        </AnimatedFade>
      )}
    </AnimatePresence>
  );
};
