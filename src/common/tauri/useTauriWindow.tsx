import React, { useState, useEffect, useRef } from 'react';
import { ErrorHandler, TauriInteropException } from '../exceptions';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { GuiSize } from '@bindings/GuiSize';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { Locale } from '@bindings/Locale';
import { translate } from '@common/i18n/i18n';
import { FrontendEvent } from '@bindings/FrontendEvent';
import { TAURI_COMMANDS } from './tauri-commands';

const isTauri = () => {
  return typeof window !== 'undefined' && (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== undefined;
};

const handleSetGuiSize = async (size: GuiSize, textIconSize: TextAndIconSize) => {
  if (!isTauri()) return;
  try {
    await invoke(TAURI_COMMANDS.SET_GUI_SIZE, { size, textAndIconSize: textIconSize });
  } catch (err) {
    ErrorHandler.handle(new TauriInteropException('Tauri resize error', err, 'ERR_TAURI_RESIZE'));
  }
};

const handleWindowAlwaysOnTop = async (onTop: boolean) => {
  if (!isTauri()) return;
  try {
    await invoke(TAURI_COMMANDS.SET_ALWAYS_ON_TOP, { alwaysOnTop: onTop });
  } catch (err) {
    ErrorHandler.handle(new TauriInteropException('Tauri always on top error', err, 'ERR_TAURI_ALWAYS_ON_TOP'));
  }
};

interface TauriWindowProps {
  guiSize: GuiSize;
  setGuiSize: (size: GuiSize) => void;
  textAndIconSize: TextAndIconSize;
  minimizeToTray: boolean;
  alwaysOnTopSmall: boolean;
  setAlwaysOnTopSmall: React.Dispatch<React.SetStateAction<boolean>>;
  alwaysOnTopMain: boolean;
  setAlwaysOnTopMain: React.Dispatch<React.SetStateAction<boolean>>;
  lastNonSmallVariant: Exclude<GuiSize, 'small'>;
  setLastNonSmallVariant: React.Dispatch<React.SetStateAction<Exclude<GuiSize, 'small'>>>;
  handleStopTimer: (specificProjectId?: string) => void;
  locale: Locale;
  customTranslations: Record<string, unknown>;
}

export const useTauriWindow = ({
  guiSize, setGuiSize,
  textAndIconSize,
  minimizeToTray,
  alwaysOnTopSmall, setAlwaysOnTopSmall,
  alwaysOnTopMain, setAlwaysOnTopMain,
  lastNonSmallVariant: _lastNonSmallVariant, setLastNonSmallVariant,
  handleStopTimer,
  locale, customTranslations
}: TauriWindowProps) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isGuiClosed, setIsGuiClosed] = useState<boolean>(false);
  const [trayNotification, setTrayNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setTrayNotification(msg);
    setTimeout(() => setTrayNotification(null), 5000);
  };

  const stateRef = useRef({
    guiSize,
    textAndIconSize,
    minimizeToTray,
    alwaysOnTopSmall,
    alwaysOnTopMain,
    locale,
    customTranslations,
    handleStopTimer,
    showToast,
    setGuiSize,
    setLastNonSmallVariant,
    setAlwaysOnTopSmall,
    setAlwaysOnTopMain,
  });

  useEffect(() => {
    stateRef.current = {
      guiSize,
      textAndIconSize,
      minimizeToTray,
      alwaysOnTopSmall,
      alwaysOnTopMain,
      locale,
      customTranslations,
      handleStopTimer,
      showToast,
      setGuiSize,
      setLastNonSmallVariant,
      setAlwaysOnTopSmall,
      setAlwaysOnTopMain,
    };
  });

  useEffect(() => {
    if (isTauri()) {
      invoke(TAURI_COMMANDS.SET_MINIMIZE_TO_TRAY, { minimize: minimizeToTray }).catch(err => {
        ErrorHandler.handle(new TauriInteropException('Failed to sync minimizeToTray with Rust', err, 'ERR_TAURI_SYNC_TRAY'));
      });
    }
  }, [minimizeToTray]);

  useEffect(() => {
    const applyWindowConfig = async () => {
      await handleSetGuiSize(guiSize, textAndIconSize);
      await new Promise(resolve => setTimeout(resolve, 50));
      if (guiSize !== 'small') {
        await handleWindowAlwaysOnTop(alwaysOnTopMain);
      } else {
        await handleWindowAlwaysOnTop(alwaysOnTopSmall);
      }
    };
    applyWindowConfig();
  }, [guiSize, textAndIconSize, alwaysOnTopSmall, alwaysOnTopMain]);

  useEffect(() => {
    if (!isTauri()) return;

    let active = true;
    const unlisteners: Array<() => void> = [];

    const setupListeners = async () => {
      try {
        const uMax = await listen('native-window-maximized' satisfies FrontendEvent, () => {
          if (!active) return;
          stateRef.current.setGuiSize('large');
          stateRef.current.setLastNonSmallVariant('large');
          stateRef.current.showToast("Rozmiar zmieniony na DUŻY (Maksymalizacja)");
        });
        unlisteners.push(uMax);

        const uRest = await listen('native-window-restored' satisfies FrontendEvent, () => {
          if (!active) return;
          stateRef.current.setGuiSize('large');
        });
        unlisteners.push(uRest);

        const uVariant = await listen('tray-set-gui-variant' satisfies FrontendEvent, async (event) => {
          if (!active) return;
          const payload = event.payload as GuiSize;
          if (['small', 'medium', 'large'].includes(payload)) {
            stateRef.current.setGuiSize(payload);
            await handleSetGuiSize(payload, stateRef.current.textAndIconSize);
            const flag = payload === 'small' ? stateRef.current.alwaysOnTopSmall : stateRef.current.alwaysOnTopMain;
            await handleWindowAlwaysOnTop(flag);
            stateRef.current.showToast(`GUI: ${payload === 'small' ? 'Mały' : payload === 'medium' ? 'Średni' : 'Duży'}`);
          }
        });
        unlisteners.push(uVariant);

        const uStopAll = await listen('tray-stop-all-timers' satisfies FrontendEvent, () => {
          if (!active) return;
          stateRef.current.handleStopTimer();
          stateRef.current.showToast(translate(stateRef.current.locale, 'app.stoppedThreads', stateRef.current.customTranslations));
        });
        unlisteners.push(uStopAll);

        const uToggleTop = await listen('tray-toggle-on-top' satisfies FrontendEvent, async () => {
          if (!active) return;
          if (stateRef.current.guiSize === 'small') {
            stateRef.current.setAlwaysOnTopSmall(prev => {
              const next = !prev;
              handleWindowAlwaysOnTop(next);
              stateRef.current.showToast(next ? 'Zawsze na wierzchu: WŁĄCZONE' : 'Zawsze na wierzchu: WYŁĄCZONE');
              return next;
            });
          } else {
            stateRef.current.setAlwaysOnTopMain(prev => {
              const next = !prev;
              handleWindowAlwaysOnTop(next);
              stateRef.current.showToast(next ? 'Zawsze na wierzchu: WŁĄCZONE' : 'Zawsze na wierzchu: WYŁĄCZONE');
              return next;
            });
          }
        });
        unlisteners.push(uToggleTop);

        const uClose = await listen('native-close-requested' satisfies FrontendEvent, async () => {
          if (!active) return;
          if (stateRef.current.minimizeToTray) {
            try {
              await invoke(TAURI_COMMANDS.HIDE_WINDOW);
            } catch (err) {
              ErrorHandler.handle(new TauriInteropException('Tauri hide_window error', err, 'ERR_TAURI_HIDE'));
            }
          } else {
            try {
              await invoke(TAURI_COMMANDS.EXIT_APP);
            } catch (err) {
              ErrorHandler.handle(new TauriInteropException('Tauri exit_app error', err, 'ERR_TAURI_EXIT'));
            }
          }
        });
        unlisteners.push(uClose);

      } catch (err) {
        ErrorHandler.handle(new TauriInteropException('Tauri listener setup error', err, 'ERR_TAURI_LISTENER_SETUP'));
      }
    };

    const promise = setupListeners();

    return () => {
      active = false;
      promise.then(() => {
        unlisteners.forEach(un => un());
      });
    };
  }, []);

  const handleMinimizeToTray = async () => {
    if (isTauri()) {
      try {
        if (minimizeToTray) {
          await invoke(TAURI_COMMANDS.HIDE_WINDOW);
        } else {
          await invoke(TAURI_COMMANDS.EXIT_APP);
        }
      } catch (err) {
        ErrorHandler.handle(new TauriInteropException('Tauri close/hide error', err, 'ERR_TAURI_CLOSE_HIDE'));
      }
    } else {
      if (minimizeToTray) {
        setIsMinimized(true);
        showToast(translate(locale, 'dynamic.oxyFlowMinimizedToTrayEngineKe', customTranslations));
      } else {
        setIsGuiClosed(true);
        showToast(translate(locale, 'dynamic.gUIClosedOxyFlowEngineLogsUISh', customTranslations));
      }
    }
  };

  const handleCloseWindow = async () => {
    if (isTauri()) {
      try {
        await invoke(TAURI_COMMANDS.CLOSE_WINDOW);
      } catch (err) {
        ErrorHandler.handle(new TauriInteropException('Tauri close error', err, 'ERR_TAURI_CLOSE'));
      }
    } else {
      setIsGuiClosed(true);
    }
  };

  const handleMinimizeWindow = async () => {
    if (isTauri()) {
      try {
        await invoke(TAURI_COMMANDS.MINIMIZE_WINDOW);
      } catch (err) {
        ErrorHandler.handle(new TauriInteropException('Tauri minimize error', err, 'ERR_TAURI_MINIMIZE'));
      }
    } else {
      setIsMinimized(true);
    }
  };

  return {
    isMinimized, setIsMinimized,
    isGuiClosed, setIsGuiClosed,
    trayNotification, setTrayNotification,
    showToast,
    handleMinimizeToTray,
    handleCloseWindow,
    handleMinimizeWindow
  };
};
