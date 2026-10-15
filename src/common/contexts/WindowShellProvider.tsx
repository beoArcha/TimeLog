import React from 'react';
import { useTauriWindow } from '../tauri/useTauriWindow';
import { useSettings } from '../hooks/SettingsContext';
import { useData } from '../hooks/DataContext';
import { useLocale } from '../hooks/LocaleProvider';
import { translate } from '../i18n/translator';
import { AlwaysOnTopConfig } from '@bindings/AlwaysOnTopConfig';
import { WindowShellContext, WindowShellState } from './WindowShellContext';

export const WindowShellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    layoutVariant, setLayoutVariant, textAndIconSize,
    minimizeToTray, setMinimizeToTray,
    alwaysOnTopSmall, setAlwaysOnTopSmall,
    alwaysOnTopMain, setAlwaysOnTopMain,
    lastNonCompactVariant, setLastNonCompactVariant
  } = useSettings();
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
      tauriWindow.showToast(translate(locale, 'timer', 'SelectTaskToPlay', customTranslations));
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    tauriWindow.showToast(translate(locale, 'common', 'CopiedToClipboard', customTranslations));
  };

  const state: WindowShellState = {
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

  return <WindowShellContext.Provider value={state}>{children}</WindowShellContext.Provider>;
};
