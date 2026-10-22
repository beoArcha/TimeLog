import React, { useState } from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import type { LayoutRouterProps } from '../types/LayoutCommonProps';
import MediumProjectSelector from '../parts/MediumProjectSelector';
import MediumTabBar, { MediumTabType } from '../parts/MediumTabBar';
import ActiveTimerBanner from '../parts/ActiveTimerBanner';
import TaskListView from '@features/tasks/TaskListView';
import ReportView from '@features/reports/ReportView';
import DbInspector from '@features/db-explorer/components/DbInspector';
import SettingsTab from '@features/settings/SettingsTab';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

import { VStack } from '@components/ui/stack';
import { Area } from '@components/ui/area';

type MediumLayoutBuilderProps = Partial<Omit<LayoutRouterProps, 'variant' | 'commonProps'>> & {
  state: GuiState;
  dockPosition?: 'right' | 'left';
  onToggleDock?: () => void;
};

export default function MediumLayoutBuilder({
  state,
  dockPosition: externalDockPos,
  onToggleDock,
}: MediumLayoutBuilderProps) {
  const { canInspectDatabase } = usePlatformCapabilities();
  const { locale, customTranslations } = state;
  const [mediumTab, setMediumTab] = useState<MediumTabType>('tasks');
  const [internalDockPos, setInternalDockPos] = useState<'right' | 'left'>(() => {
    try {
      return (localStorage.getItem('oxy_medium_dock_pos') as 'right' | 'left') || 'right';
    } catch (err) {
      ErrorHandler.handle(new PersistenceException('Failed to read medium dock position from localStorage', err, 'WARN_STORAGE_READ', 'WARN'));
      return 'right';
    }
  });

  const dockPosition = externalDockPos ?? internalDockPos;

  const toggleDock = () => {
    if (onToggleDock) {
      onToggleDock();
    } else {
      const next = dockPosition === 'right' ? 'left' : 'right';
      setInternalDockPos(next);
      try {
        localStorage.setItem('oxy_medium_dock_pos', next);
      } catch (err) {
        ErrorHandler.handle(new PersistenceException('Failed to save medium dock position to localStorage', err, 'WARN_STORAGE_WRITE', 'WARN'));
      }
    }
  };

  return (
    <Area
      as="section"
      data-testid="medium-layout"
      className="w-full flex-1 flex flex-col transition-all duration-300 min-h-0 overflow-hidden"
    >
      <VStack id="gui-container" className="flex-1 min-h-0 overflow-hidden">
        <MediumProjectSelector
          state={state}
          dockPosition={dockPosition}
          onToggleDock={toggleDock}
        />

        <VStack
          as="main"
          id="tasks-main"
          role="main"
          aria-label="Main content"
          gap="sm"
          className="flex-1 min-h-0 overflow-y-auto pr-0.5"
        >
          {mediumTab === 'tasks' && (
            <>
              <ActiveTimerBanner state={state} isCondensed={true} />
              <TaskListView state={state} isCondensed={true} />
            </>
          )}

          {mediumTab === 'reports' && <ReportView state={state} />}

          {mediumTab === 'settings' && (
            <VStack gap="sm">
              <SettingsTab />
              {canInspectDatabase && <DbInspector state={state} isCondensed={true} />}
            </VStack>
          )}
        </VStack>

        <MediumTabBar
          currentTab={mediumTab}
          onSelectTab={setMediumTab}
          locale={locale}
          customTranslations={customTranslations}
        />
      </VStack>
    </Area>
  );
}
