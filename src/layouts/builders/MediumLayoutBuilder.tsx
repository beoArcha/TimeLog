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
  const { theme, locale, customTranslations } = state;
  const [mediumTab, setMediumTab] = useState<MediumTabType>('tasks');
  const [internalDockPos, setInternalDockPos] = useState<'right' | 'left'>(() => {
    try {
      return (localStorage.getItem('oxy_medium_dock_pos') as 'right' | 'left') || 'right';
    } catch {
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
      } catch {}
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

        <div id="tasks-main" className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-0.5">
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
        </div>

        <MediumTabBar
          currentTab={mediumTab}
          onSelectTab={setMediumTab}
          theme={theme}
          locale={locale}
          customTranslations={customTranslations}
        />
      </div>
    </div>
  );
}
