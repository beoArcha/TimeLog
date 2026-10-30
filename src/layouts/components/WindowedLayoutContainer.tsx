import React from 'react';
import { AnimatedFade } from '@components/AnimatedFade';
import Header from './Header';
import TabBar from './TabBar';
import DaemonStatusBar from './DaemonStatusBar';
import AppFooter from './AppFooter';
import MediumLayoutBuilder from '../builders/MediumLayoutBuilder';
import { FullTabSwitchView } from './FullTabSwitchView';
import { GuiState } from '../hooks/useGuiLogic';
import { AppTabId } from '@common/types/navigation';
import { LayoutVariant } from '@bindings/LayoutVariant';
import { isMediumLayout, isFullLayout } from '@common/constants/layoutVariants';

export interface WindowedLayoutContainerProps {
  layoutVariant: LayoutVariant;
  mediumDockPosition: 'right' | 'left';
  activeLargeTab: AppTabId;
  setActiveLargeTab: (tab: AppTabId) => void;
  locale: string;
  customTranslations?: Record<string, unknown>;
  handleResetLocalStorage?: () => void;
  setShowCreditsModal: (show: boolean) => void;
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

export const WindowedLayoutContainer: React.FC<WindowedLayoutContainerProps> = ({
  layoutVariant,
  mediumDockPosition,
  activeLargeTab,
  setActiveLargeTab,
  locale,
  customTranslations,
  handleResetLocalStorage: _handleResetLocalStorage,
  setShowCreditsModal,
  guiState,
  sharedProps,
}) => {
  const isMedium = isMediumLayout(layoutVariant);
  const isFull = isFullLayout(layoutVariant);

  return (
    <AnimatedFade
      key="windowed-state"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex-1 flex flex-col w-full min-h-0 overflow-hidden"
    >
      <div className={`rounded-none sm:rounded-[2rem] shadow-3xl overflow-hidden flex flex-col flex-1 min-h-0 border border-border transition-all duration-300 bg-card/50 backdrop-blur-2xl ${
        isMedium
          ? `w-full md:max-w-4xl lg:max-w-[500px] xl:max-w-[540px] ${
              mediumDockPosition === 'left'
                ? 'md:mx-auto lg:ml-4 lg:mr-auto xl:ml-8'
                : 'md:mx-auto lg:mr-4 lg:ml-auto xl:mr-8'
            }`
          : 'w-full'
      }`}>

        <Header />

        {isFull && (
          <TabBar
            locale={locale}
            customTranslations={customTranslations}
            activeLargeTab={activeLargeTab}
            setActiveLargeTab={setActiveLargeTab}
          />
        )}

        <main className={`flex-1 min-h-0 w-full z-10 flex flex-col ${
          isMedium
            ? 'p-2.5 sm:p-4 md:p-5 overflow-hidden'
            : 'w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 gap-5 overflow-y-auto overflow-x-hidden'
        }`}>

          <div className="shrink-0 mb-1">
            <DaemonStatusBar />
          </div>

          <div id="tab-viewport" className={isMedium ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : 'w-full min-w-0 min-h-[480px] flex-1 flex flex-col'}>
            {isMedium && (
              <MediumLayoutBuilder
                state={guiState}
                {...sharedProps}
              />
            )}

            {isFull && (
              <FullTabSwitchView
                activeLargeTab={activeLargeTab}
                guiState={guiState}
                sharedProps={sharedProps}
              />
            )}
          </div>
        </main>

        <div className={isMedium ? 'hidden sm:block shrink-0' : 'shrink-0'}>
          <AppFooter
            locale={locale}
            customTranslations={customTranslations}
            onNavigateToSettings={() => setActiveLargeTab('settings')}
            setShowCreditsModal={setShowCreditsModal}
          />
        </div>

      </div>
    </AnimatedFade>
  );
};
