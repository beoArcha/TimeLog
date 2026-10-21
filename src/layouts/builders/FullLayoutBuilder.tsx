import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import type { LayoutRouterProps } from '../types/LayoutCommonProps';
import Sidebar from '../parts/Sidebar';
import ActiveTimerBanner from '../parts/ActiveTimerBanner';
import TaskListView from '@features/tasks/TaskListView';
import ReportView from '@features/reports/ReportView';
import DbInspector from '@features/db-explorer/components/DbInspector';

type FullLayoutBuilderProps = Omit<LayoutRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function FullLayoutBuilder({ state }: FullLayoutBuilderProps) {
  const { activeView } = state;

  return (
    <div
      id="gui-container"
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-foreground flex-1 w-full max-w-full min-w-0 gui-min-size"
    >
      <Sidebar state={state} />

      <main id="tasks-main" role="main" aria-label="Main content" className="lg:col-span-8 flex flex-col gap-6 min-w-0 w-full">
        <ActiveTimerBanner state={state} isCondensed={false} />

        {activeView === 'tasks' && <TaskListView state={state} isCondensed={false} />}
        {activeView === 'reports' && <ReportView state={state} />}

        <DbInspector state={state} isCondensed={false} />
      </main>
    </div>
  );
}
