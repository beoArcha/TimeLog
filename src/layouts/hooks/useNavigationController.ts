import { useState, useCallback } from 'react';
import { AppTabId, APP_TAB_IDS } from '@common/types/navigation';
import { isFullLayout } from '@common/constants/layoutVariants';
import { LayoutVariant } from '@bindings/LayoutVariant';

export interface UseNavigationControllerProps {
  initialTab?: AppTabId;
  activeLargeTab?: AppTabId;
  setActiveLargeTab?: (tab: AppTabId) => void;
  layoutVariant?: LayoutVariant;
}

/**
 * Controller hook managing active view routing, tab transitions, and DB inspector toggle.
 */
export function useNavigationController({
  initialTab = 'tasks',
  activeLargeTab: controlledTab,
  setActiveLargeTab: controlledSetTab,
  layoutVariant,
}: UseNavigationControllerProps = {}) {
  const [internalTab, setInternalTab] = useState<AppTabId>(initialTab);
  const [showDbInspector, setShowDbInspector] = useState(false);

  const activeTab = controlledTab ?? internalTab;

  const setActiveTab = useCallback(
    (tab: AppTabId) => {
      if (controlledSetTab) {
        controlledSetTab(tab);
      } else {
        setInternalTab(tab);
      }
    },
    [controlledSetTab]
  );

  const switchTabByIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < APP_TAB_IDS.length) {
        if (!layoutVariant || isFullLayout(layoutVariant)) {
          setActiveTab(APP_TAB_IDS[index]);
        }
      }
    },
    [layoutVariant, setActiveTab]
  );

  const activeView = activeTab === 'reports' ? 'reports' : 'tasks';

  return {
    activeTab,
    setActiveTab,
    activeView,
    showDbInspector,
    setShowDbInspector,
    switchTabByIndex,
    availableTabs: APP_TAB_IDS,
  };
}
