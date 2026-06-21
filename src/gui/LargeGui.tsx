import React from 'react';
import { GuiState } from './useGuiLogic';
import type { GuiRouterProps } from './GuiCommonProps';
import Sidebar from './parts/Sidebar';
import ActiveTimerBanner from './parts/ActiveTimerBanner';
import TaskListView from '@features/tasks/TaskListView';
import ReportView from './parts/ReportView';
import DbInspector from './parts/DbInspector';
import { GUI_MIN_SIZES } from './parts/guiStyles';

type LargeGuiProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function LargeGui({ state }: LargeGuiProps) {
  const { theme, activeView, textAndIconSize = 'medium' } = state;

  return (
    <div
      id="gui-container"
      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'} flex-1`}
      style={GUI_MIN_SIZES.large[textAndIconSize as keyof typeof GUI_MIN_SIZES.large] || GUI_MIN_SIZES.large['medium']}
    >
      <Sidebar state={state} />

      <div id="tasks-main" className={`lg:col-span-8 flex flex-col gap-6`}>
        <ActiveTimerBanner state={state} isCondensed={false} />

        {activeView === 'tasks' && <TaskListView state={state} isCondensed={false} />}
        {activeView === 'reports' && <ReportView state={state} />}

        <DbInspector state={state} isCondensed={false} />
      </div>
    </div>
  );
}
