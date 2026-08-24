import React, { useState, useEffect, useRef } from 'react';
import { ErrorHandler, TauriInteropException } from '../exceptions';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { LayoutVariant } from '@bindings/LayoutVariant';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { Locale } from '@bindings/Locale';
import { translate } from '@common/i18n/translator';
import { FrontendEvent } from '@bindings/FrontendEvent';
import { TAURI_COMMANDS } from './tauri-commands';

const isTauri = () => {
  return typeof window !== 'undefined' && (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== undefined;
};

const handleSetLayoutVariant = async (variant: LayoutVariant, textIconSize: TextAndIconSize) => {
  if (!isTauri()) return;
  try {
    await invoke(TAURI_COMMANDS.SET_LAYOUT_VARIANT, { variant, textAndIconSize: textIconSize });
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
  layoutVariant: LayoutVariant;
  setLayoutVariant: (variant: LayoutVariant) => void;
  textAndIconSize: TextAndIconSize;
  minimizeToTray: boolean;
  setMinimizeToTray: React.Dispatch<React.SetStateAction<boolean>>;
  alwaysOnTopSmall: boolean;
  setAlwaysOnTopSmall: React.Dispatch<React.SetStateAction<boolean>>;
  alwaysOnTopMain: boolean;
  setAlwaysOnTopMain: React.Dispatch<React.SetStateAction<boolean>>;
  lastNonCompactVariant: Exclude<LayoutVariant, 'compact'>;
  setLastNonCompactVariant: React.Dispatch<React.SetStateAction<Exclude<LayoutVariant, 'compact'>>>;
  handleStopTimer: (specificProjectId?: string) => void;
  locale: Locale;
  customTranslations: Record<string, unknown>;
}

export const useTauriWindow = ({
  layoutVariant, setLayoutVariant,
  textAndIconSize,
  minimizeToTray, setMinimizeToTray,
  alwaysOnTopSmall, setAlwaysOnTopSmall,
  alwaysOnTopMain, setAlwaysOnTopMain,
  lastNonCompactVariant: _lastNonCompactVariant, setLastNonCompactVariant,
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
    layoutVariant,
    textAndIconSize,
    minimizeToTray,
    alwaysOnTopSmall,
    alwaysOnTopMain,
    locale,
    customTranslations,
    handleStopTimer,
    showToast,
    setLayoutVariant,
    setLastNonCompactVariant,
    setAlwaysOnTopSmall,
    setAlwaysOnTopMain,
    setMinimizeToTray,
  });

  useEffect(() => {
    stateRef.current = {
      layoutVariant,
      textAndIconSize,
      minimizeToTray,
      alwaysOnTopSmall,
      alwaysOnTopMain,
      locale,
      customTranslations,
      handleStopTimer,
      showToast,
      setLayoutVariant,
      setLastNonCompactVariant,
      setAlwaysOnTopSmall,
      setAlwaysOnTopMain,
      setMinimizeToTray,
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
      await handleSetLayoutVariant(layoutVariant, textAndIconSize);
      await new Promise(resolve => setTimeout(resolve, 50));
      if (layoutVariant !== 'compact') {
        await handleWindowAlwaysOnTop(alwaysOnTopMain);
      } else {
        await handleWindowAlwaysOnTop(alwaysOnTopSmall);
      }
    };
    applyWindowConfig();
  }, [layoutVariant, textAndIconSize, alwaysOnTopSmall, alwaysOnTopMain]);

  useEffect(() => {
    if (!isTauri()) return;

    let active = true;
    const unlisteners: Array<() => void> = [];

    const setupListeners = async () => {
      try {
        const uMax = await listen('native-window-maximized' satisfies FrontendEvent, () => {
          if (!active) return;
          stateRef.current.setLayoutVariant('full');
          stateRef.current.setLastNonCompactVariant('full');
          stateRef.current.showToast("Rozmiar zmieniony na PEŁNY (Maksymalizacja)");
        });
        unlisteners.push(uMax);

        const uRest = await listen('native-window-restored' satisfies FrontendEvent, () => {
          if (!active) return;
          stateRef.current.setLayoutVariant('full');
        });
        unlisteners.push(uRest);

        const uVariant = await listen('tray-set-gui-variant' satisfies FrontendEvent, async (event) => {
          if (!active) return;
          const payload = event.payload as LayoutVariant;
          if (['compact', 'medium', 'full'].includes(payload)) {
            stateRef.current.setLayoutVariant(payload);
            await handleSetLayoutVariant(payload, stateRef.current.textAndIconSize);
            const flag = payload === 'compact' ? stateRef.current.alwaysOnTopSmall : stateRef.current.alwaysOnTopMain;
            await handleWindowAlwaysOnTop(flag);
            stateRef.current.showToast(`GUI: ${payload === 'compact' ? 'Kompaktowy' : payload === 'medium' ? 'Średni' : 'Pełny'}`);
          }
        });
        unlisteners.push(uVariant);

        const uStopAll = await listen('tray-stop-all-timers' satisfies FrontendEvent, () => {
          if (!active) return;
          stateRef.current.handleStopTimer();
          stateRef.current.showToast(translate(stateRef.current.locale, 'app', 'StoppedThreads', stateRef.current.customTranslations));
        });
        unlisteners.push(uStopAll);

        const uToggleTop = await listen('tray-toggle-on-top' satisfies FrontendEvent, async () => {
          if (!active) return;
          if (stateRef.current.layoutVariant === 'compact') {
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

        const uToggleMinTray = await listen('tray-toggle-minimize-to-tray' satisfies FrontendEvent, (event) => {
          if (!active) return;
          const next = typeof event.payload === 'boolean' ? event.payload : !stateRef.current.minimizeToTray;
          stateRef.current.setMinimizeToTray(next);
          stateRef.current.showToast(next ? 'Minimalizuj do zasobnika: WŁĄCZONE' : 'Minimalizuj do zasobnika: WYŁĄCZONE');
        });
        unlisteners.push(uToggleMinTray);


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
        showToast(translate(locale, 'app', 'OxyFlowMinimizedToTray', customTranslations));
      } else {
        setIsGuiClosed(true);
        showToast(translate(locale, 'app', 'GuiClosedEngineKeepRunning', customTranslations));
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
