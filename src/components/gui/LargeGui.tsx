import React from 'react';
import { GuiState } from './useGuiLogic';
import type { GuiRouterProps } from './GuiRouter';
import Sidebar from './parts/Sidebar';
import ActiveTimerBanner from './parts/ActiveTimerBanner';
import TaskListView from './parts/TaskListView';
import ReportView from './parts/ReportView';
import DbInspector from './parts/DbInspector';

type LargeGuiProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function LargeGui({ state }: LargeGuiProps) {
  const { theme, activeView, uiScale = 'QHD' } = state;

  const minSizes = {
    'FHD': { minWidth: '1280px', minHeight: '720px' },
    'QHD': { minWidth: '1920px', minHeight: '1080px' },
    'UHD': { minWidth: '2560px', minHeight: '1440px' }
  };

  return (
    <div 
      id="gui-container" 
      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${theme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'} flex-1`}
      style={minSizes[uiScale as keyof typeof minSizes] || minSizes['QHD']}
    >
      {/* 1. Projects Sidebar - Left 4 Cols */}
      <Sidebar state={state} />

      {/* 2. Main Content - Right 8 Cols */}
      <div id="tasks-main" className={`lg:col-span-8 flex flex-col gap-6`}>
        <ActiveTimerBanner state={state} isCondensed={false} />
        
        {activeView === 'tasks' && <TaskListView state={state} isCondensed={false} />}
        {activeView === 'reports' && <ReportView state={state} />}
        
        <DbInspector state={state} isCondensed={false} />
      </div>
    </div>
  );
}
