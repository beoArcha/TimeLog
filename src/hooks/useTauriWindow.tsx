import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { GuiSize } from '../bindings/GuiSize';
import { TextAndIconSize } from '../bindings/TextAndIconSize';
import { Locale } from '../bindings/Locale';
import { translate } from '../utils/i18n';
import { FrontendEvent } from '../types';

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

const handleSetGuiSize = async (size: GuiSize, textIconSize: TextAndIconSize) => {
  if (!isTauri()) return;
  try {
    await invoke('set_gui_size', { size, textAndIconSize: textIconSize });
  } catch (err) {
    console.error('Tauri resize error:', err);
  }
};

const handleWindowAlwaysOnTop = async (onTop: boolean) => {
  if (!isTauri()) return;
  try {
    await invoke('set_always_on_top', { alwaysOnTop: onTop });
  } catch (err) {
    console.error('Tauri always on top error:', err);
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
  customTranslations: any;
}

export const useTauriWindow = ({
  guiSize, setGuiSize,
  textAndIconSize,
  minimizeToTray,
  alwaysOnTopSmall, setAlwaysOnTopSmall,
  alwaysOnTopMain, setAlwaysOnTopMain,
  lastNonSmallVariant, setLastNonSmallVariant,
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

  const guiSizeRef = useRef(guiSize);
  const textAndIconSizeRef = useRef(textAndIconSize);
  const minimizeToTrayRef = useRef(minimizeToTray);
  const alwaysOnTopSmallRef = useRef(alwaysOnTopSmall);
  const alwaysOnTopMainRef = useRef(alwaysOnTopMain);
  const localeRef = useRef(locale);
  const customTranslationsRef = useRef(customTranslations);
  const handleStopTimerRef = useRef(handleStopTimer);
  const showToastRef = useRef(showToast);
  const setGuiSizeRef = useRef(setGuiSize);
  const setLastNonSmallVariantRef = useRef(setLastNonSmallVariant);
  const setAlwaysOnTopSmallRef = useRef(setAlwaysOnTopSmall);
  const setAlwaysOnTopMainRef = useRef(setAlwaysOnTopMain);

  useEffect(() => {
    guiSizeRef.current = guiSize;
    textAndIconSizeRef.current = textAndIconSize;
    minimizeToTrayRef.current = minimizeToTray;
    alwaysOnTopSmallRef.current = alwaysOnTopSmall;
    alwaysOnTopMainRef.current = alwaysOnTopMain;
    localeRef.current = locale;
    customTranslationsRef.current = customTranslations;
    handleStopTimerRef.current = handleStopTimer;
    showToastRef.current = showToast;
    setGuiSizeRef.current = setGuiSize;
    setLastNonSmallVariantRef.current = setLastNonSmallVariant;
    setAlwaysOnTopSmallRef.current = setAlwaysOnTopSmall;
    setAlwaysOnTopMainRef.current = setAlwaysOnTopMain;
  });

  useEffect(() => {
    if (isTauri()) {
      invoke('set_minimize_to_tray', { minimize: minimizeToTray }).catch(err => {
        console.error('Failed to sync minimizeToTray with Rust:', err);
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
    const unlisteners: Function[] = [];

    const setupListeners = async () => {
      try {
        const uMax = await listen('native-window-maximized' satisfies FrontendEvent, () => {
          if (!active) return;
          setGuiSizeRef.current('large');
          setLastNonSmallVariantRef.current('large');
          showToastRef.current("Rozmiar zmieniony na DUŻY (Maksymalizacja)");
        });
        unlisteners.push(uMax);

        const uRest = await listen('native-window-restored' satisfies FrontendEvent, () => {
          if (!active) return;
          setGuiSizeRef.current('large');
        });
        unlisteners.push(uRest);

        const uVariant = await listen('tray-set-gui-variant' satisfies FrontendEvent, async (event) => {
          if (!active) return;
          const payload = event.payload as GuiSize;
          if (['small', 'medium', 'large'].includes(payload)) {
            setGuiSizeRef.current(payload);
            await handleSetGuiSize(payload, textAndIconSizeRef.current);
            const flag = payload === 'small' ? alwaysOnTopSmallRef.current : alwaysOnTopMainRef.current;
            await handleWindowAlwaysOnTop(flag);
            showToastRef.current(`GUI: ${payload === 'small' ? 'Mały' : payload === 'medium' ? 'Średni' : 'Duży'}`);
          }
        });
        unlisteners.push(uVariant);

        const uStopAll = await listen('tray-stop-all-timers' satisfies FrontendEvent, () => {
          if (!active) return;
          handleStopTimerRef.current();
          showToastRef.current(translate(localeRef.current, 'app.stoppedThreads', customTranslationsRef.current));
        });
        unlisteners.push(uStopAll);

        const uToggleTop = await listen('tray-toggle-on-top' satisfies FrontendEvent, async () => {
          if (!active) return;
          if (guiSizeRef.current === 'small') {
            setAlwaysOnTopSmallRef.current(prev => {
              const next = !prev;
              handleWindowAlwaysOnTop(next);
              showToastRef.current(next ? 'Zawsze na wierzchu: WŁĄCZONE' : 'Zawsze na wierzchu: WYŁĄCZONE');
              return next;
            });
          } else {
            setAlwaysOnTopMainRef.current(prev => {
              const next = !prev;
              handleWindowAlwaysOnTop(next);
              showToastRef.current(next ? 'Zawsze na wierzchu: WŁĄCZONE' : 'Zawsze na wierzchu: WYŁĄCZONE');
              return next;
            });
          }
        });
        unlisteners.push(uToggleTop);

        const uClose = await listen('native-close-requested' satisfies FrontendEvent, async () => {
          if (!active) return;
          if (minimizeToTrayRef.current) {
            try {
              await invoke('hide_window');
            } catch (err) {
              console.error('Tauri hide_window error', err);
            }
          } else {
            try {
              await invoke('exit_app');
            } catch (err) {
              console.error('Tauri exit_app error', err);
            }
          }
        });
        unlisteners.push(uClose);

      } catch (err) {
        console.error('Tauri listener setup error:', err);
      }
    };

    setupListeners();

    return () => {
      active = false;
      unlisteners.forEach(un => un());
    };
  }, []);

  const handleMinimizeToTray = async () => {
    if (isTauri()) {
      try {
        if (minimizeToTray) {
          await invoke('hide_window');
        } else {
          await invoke('exit_app');
        }
      } catch (err) {
        console.error('Tauri close/hide error:', err);
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
        await invoke('close_window');
      } catch (err) {
        console.error('Tauri close error:', err);
      }
    } else {
      setIsGuiClosed(true);
    }
  };

  const handleMinimizeWindow = async () => {
    if (isTauri()) {
      try {
        await invoke('minimize_window');
      } catch (err) {
        console.error('Tauri minimize error:', err);
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
