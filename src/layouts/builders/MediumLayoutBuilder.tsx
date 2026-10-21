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
    <div
      data-testid="medium-layout"
      className="w-full flex-1 flex flex-col transition-all duration-300 min-h-0 overflow-hidden"
    >
      <div id="gui-container" className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <MediumProjectSelector
          state={state}
          dockPosition={dockPosition}
          onToggleDock={toggleDock}
        />

        <main id="tasks-main" role="main" aria-label="Main content" className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-0.5">
          {mediumTab === 'tasks' && (
            <>
              <ActiveTimerBanner state={state} isCondensed={true} />
              <TaskListView state={state} isCondensed={true} />
            </>
          )}

          {mediumTab === 'reports' && <ReportView state={state} />}

          {mediumTab === 'settings' && (
            <div className="flex flex-col gap-4">
              <SettingsTab />
              <DbInspector state={state} isCondensed={true} />
            </div>
          )}
        </main>

        <MediumTabBar
          currentTab={mediumTab}
          onSelectTab={setMediumTab}
          locale={locale}
          customTranslations={customTranslations}
        />
      </div>
    </div>
  );
}
