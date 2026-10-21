import React from "react";
import { AnimatePresence } from "motion/react";
import AppProviders from "./AppProviders";
import { useLayoutManagerOrchestrator } from "../hooks/useLayoutManagerOrchestrator";

import TrayWidgetView from "@features/tray/TrayWidgetView";
import CliDrawer from "@features/cli/CliDrawer";
import GuiClosedAlert from "../components/GuiClosedAlert";
import SystemNotification from "../components/SystemNotification";
import CreditsModal from "../components/CreditsModal";
import BackgroundGradients from "../components/BackgroundGradients";
import RestoreButton from "../components/RestoreButton";
import CompactLayoutBuilder from "../builders/CompactLayoutBuilder";
import { WindowedLayoutContainer } from "../components/WindowedLayoutContainer";

interface LayoutManagerContentProps {
  runtime: "tauri" | "browser";
}

function LayoutManagerContent({ runtime }: LayoutManagerContentProps) {
  const {
    isGuiClosed,
    isMinimized,
    setIsMinimized,
    layoutVariant,
    textAndIconSize,
    guiState,
    sharedProps,
    mediumDockPosition,
    activeLargeTab,
    setActiveLargeTab,
    locale,
    customTranslations,
    showToast,
    handleResetLocalStorage,
    setShowCreditsModal,
    handleRestoreFromTray,
    handleStopAllThreads,
    closeDrawer,
  } = useLayoutManagerOrchestrator();

  if (isGuiClosed) {
    return <GuiClosedAlert />;
  }

  const renderLayoutContent = () => {
    if (isMinimized) {
      return (
        <TrayWidgetView
          onRestore={handleRestoreFromTray}
          onStopAll={handleStopAllThreads}
          showToast={showToast}
        />
      );
    }
    if (layoutVariant === "compact") {
      return <CompactLayoutBuilder state={guiState} {...sharedProps} />;
    }
    return (
      <WindowedLayoutContainer
        layoutVariant={layoutVariant}
        mediumDockPosition={mediumDockPosition}
        activeLargeTab={activeLargeTab}
        setActiveLargeTab={setActiveLargeTab}
        locale={locale}
        customTranslations={customTranslations}
        handleResetLocalStorage={handleResetLocalStorage!}
        setShowCreditsModal={setShowCreditsModal!}
        guiState={guiState}
        sharedProps={sharedProps}
      />
    );
  };

  return (
    <div
      id="app-root-container"
      data-runtime={runtime}
      data-layout-variant={layoutVariant}
      data-text-size={textAndIconSize || "medium"}
      className="h-[100dvh] max-h-screen overflow-hidden flex flex-col font-sans transition-all duration-500 relative p-1.5 sm:p-3 md:p-5 bg-background text-foreground selection:bg-orange-500/20 selection:text-orange-950"
    >
      <BackgroundGradients />

      <SystemNotification />

      <AnimatePresence mode="wait">{renderLayoutContent()}</AnimatePresence>

      <CliDrawer onClose={closeDrawer} />

      <CreditsModal />

      {isMinimized && (
        <RestoreButton setIsMinimized={setIsMinimized} showToast={showToast!} />
      )}
    </div>
  );
}

export default function LayoutManager({
  runtime,
}: {
  runtime: "tauri" | "browser";
}) {
  return (
    <AppProviders>
      <LayoutManagerContent runtime={runtime} />
    </AppProviders>
  );
}
