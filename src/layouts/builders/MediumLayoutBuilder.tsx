import React from 'react';
import { GuiState } from '../hooks/useGuiLogic';
import type { LayoutRouterProps } from '../types/LayoutCommonProps';
import ActiveTimerBanner from '../parts/ActiveTimerBanner';
import TaskListView from '@features/tasks/TaskListView';
import ReportView from '@features/reports/ReportView';
import DbInspector from '@features/db-explorer/components/DbInspector';
import { GUI_MIN_SIZES } from '../parts/LayoutStyles';

type MediumLayoutBuilderProps = Omit<LayoutRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function MediumLayoutBuilder({ state }: MediumLayoutBuilderProps) {
  const { theme, activeView, textAndIconSize = 'medium' } = state;

  return (
    <div className="w-full h-full flex flex-col p-4 overflow-auto">
      <div
        id="gui-container"
        className={`grid grid-cols-1 gap-8 ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'} flex-1`}
        style={GUI_MIN_SIZES.medium[textAndIconSize]}
      >
        <div id="tasks-main" className="lg:col-span-12 flex flex-col gap-6">
          <ActiveTimerBanner state={state} isCondensed={true} />

          {activeView === 'tasks' && <TaskListView state={state} isCondensed={true} />}
          {activeView === 'reports' && <ReportView state={state} />}

          <DbInspector state={state} isCondensed={true} />
        </div>
      </div>
    </div>
  );
}
