import React from 'react';
import { GuiState } from './useGuiLogic';
import type { GuiRouterProps } from './GuiRouter';
import ActiveTimerBanner from './parts/ActiveTimerBanner';
import TaskListView from '@features/tasks/TaskListView';
import ReportView from './parts/ReportView';
import DbInspector from './parts/DbInspector';
import { GUI_MIN_SIZES } from './parts/guiStyles';

type MediumGuiProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function MediumGui({ state }: MediumGuiProps) {
  const { theme, activeView, textAndIconSize = 'medium' } = state;

  return (
    <div className="w-full h-full flex flex-col p-4 overflow-auto">
      <div 
        id="gui-container" 
        className={`grid grid-cols-1 gap-8 ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'} flex-1`}
        style={GUI_MIN_SIZES.medium[textAndIconSize as keyof typeof GUI_MIN_SIZES.medium] || GUI_MIN_SIZES.medium['medium']}
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
