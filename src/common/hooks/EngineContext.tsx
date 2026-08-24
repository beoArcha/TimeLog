import React, { createContext, useContext } from 'react';
import { useTauriWindow } from '../tauri/useTauriWindow';
import { useSettings } from './SettingsContext';
import { useData } from './DataContext';
import { useLocale } from './LocaleProvider';
import { ContextException } from '../exceptions';
import { translate } from '../i18n/translator';
import { AlwaysOnTopConfig } from '@bindings/AlwaysOnTopConfig';

export type EngineState = {
  nowIso: string;
  setNowIso: (iso: string) => void;
} & ReturnType<typeof useTauriWindow> & {
  handleToggleTimer: () => void;
  handleCopyText: (text: string) => void;
  alwaysOnTopConfig: AlwaysOnTopConfig;
  activeTab: 'gui' | 'cli' | 'rust';
  setActiveTab: React.Dispatch<React.SetStateAction<'gui' | 'cli' | 'rust'>>;
  isMediumHeaderOpen: boolean;
  setIsMediumHeaderOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingTranslationKey: string | null;
  setEditingTranslationKey: React.Dispatch<React.SetStateAction<string | null>>;
  editingTranslationValue: string;
  setEditingTranslationValue: React.Dispatch<React.SetStateAction<string>>;
};

export const EngineContext = createContext<EngineState | undefined>(undefined);

export const useEngine = () => {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new ContextException('useEngine must be used within EngineProvider', 'ERR_ENGINE_CONTEXT');
  return ctx;
};

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { layoutVariant, setLayoutVariant, textAndIconSize, minimizeToTray, setMinimizeToTray, alwaysOnTopSmall, setAlwaysOnTopSmall, alwaysOnTopMain, setAlwaysOnTopMain, lastNonCompactVariant, setLastNonCompactVariant } = useSettings();
  const { handleStopTimer, activeLog, selectedTaskId, handleStartTimer, computedMetrics } = useData();
  const { locale, customTranslations } = useLocale();

  const tauriWindow = useTauriWindow({
    layoutVariant,
    setLayoutVariant,
    textAndIconSize,
    minimizeToTray,
    setMinimizeToTray,
    alwaysOnTopSmall,
    setAlwaysOnTopSmall,
    alwaysOnTopMain,
    setAlwaysOnTopMain,
    lastNonCompactVariant,
    setLastNonCompactVariant,
    handleStopTimer,
    locale,
    customTranslations
  });


  const [activeTab, setActiveTab] = React.useState<'gui' | 'cli' | 'rust'>('gui');
  const [isMediumHeaderOpen, setIsMediumHeaderOpen] = React.useState<boolean>(false);
  const [editingTranslationKey, setEditingTranslationKey] = React.useState<string | null>(null);
  const [editingTranslationValue, setEditingTranslationValue] = React.useState<string>('');

  const getAlwaysOnTopConfig = (): AlwaysOnTopConfig => {
    return {
      small: alwaysOnTopSmall,
      main: alwaysOnTopMain,
    };
  };

  const handleToggleTimer = () => {
    if (activeLog) {
      handleStopTimer();
    } else if (selectedTaskId) {
      handleStartTimer(selectedTaskId);
    } else {
      tauriWindow.showToast(translate(locale, 'timer', 'SelectTaskToPlay', customTranslations) || 'Zaznacz zadanie aby rozpocząć/zatrzymać timer');
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    tauriWindow.showToast(translate(locale, 'common', 'CopiedToClipboard', customTranslations));
  };

  const state: EngineState = {
    nowIso: computedMetrics?.snapshotNowIso || '',
    setNowIso: () => {},
    ...tauriWindow,
    handleToggleTimer,
    handleCopyText,
    alwaysOnTopConfig: getAlwaysOnTopConfig(),
    activeTab, setActiveTab,
    isMediumHeaderOpen, setIsMediumHeaderOpen,
    editingTranslationKey, setEditingTranslationKey,
    editingTranslationValue, setEditingTranslationValue,
  };

  return <EngineContext.Provider value={state}>{children}</EngineContext.Provider>;
};
