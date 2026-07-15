import { useState } from 'react';
import { useLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import { AlwaysOnTopConfig } from '@bindings/AlwaysOnTopConfig';

import { useAppSettings } from './useAppSettings';
import { useTimeTicker } from './useTimeTicker';
import { useExternalApiSync } from './useExternalApiSync';
import { useTimeLogData } from './useTimeLogData';
import { useTauriWindow } from '@common/tauri/useTauriWindow';

export const useOxyAppState = () => {
  const [activeTab, setActiveTab] = useState<'gui' | 'cli' | 'rust'>('gui');
  const [isMediumHeaderOpen, setIsMediumHeaderOpen] = useState<boolean>(false);
  const [editingTranslationKey, setEditingTranslationKey] = useState<string | null>(null);
  const [editingTranslationValue, setEditingTranslationValue] = useState<string>('');

  const { localePref, setLocalePref, locale, setLocale, customTranslations, setCustomTranslations } = useLocale();

  const appSettings = useAppSettings();
  const timeTicker = useTimeTicker();
  const apiSync = useExternalApiSync();
  const timeLogData = useTimeLogData(apiSync.pushToApi);
  const tauriWindow = useTauriWindow({
    layoutVariant: appSettings.layoutVariant,
    setLayoutVariant: appSettings.setLayoutVariant,
    textAndIconSize: appSettings.textAndIconSize,
    minimizeToTray: appSettings.minimizeToTray,
    alwaysOnTopSmall: appSettings.alwaysOnTopSmall,
    setAlwaysOnTopSmall: appSettings.setAlwaysOnTopSmall,
    alwaysOnTopMain: appSettings.alwaysOnTopMain,
    setAlwaysOnTopMain: appSettings.setAlwaysOnTopMain,
    lastNonCompactVariant: appSettings.lastNonCompactVariant,
    setLastNonCompactVariant: appSettings.setLastNonCompactVariant,
    handleStopTimer: timeLogData.handleStopTimer,
    locale,
    customTranslations
  });

  const getAlwaysOnTopConfig = (): AlwaysOnTopConfig => {
    return {
      small: appSettings.alwaysOnTopSmall,
      main: appSettings.alwaysOnTopMain,
    };
  };

  const handleToggleTimer = () => {
    if (timeLogData.activeLog) {
      timeLogData.handleStopTimer();
    } else if (timeLogData.selectedTaskId) {
      timeLogData.handleStartTimer(timeLogData.selectedTaskId);
    } else {
      tauriWindow.showToast(translate(locale, 'timer', 'SelectTaskToPlay', customTranslations) || 'Zaznacz zadanie aby rozpocząć/zatrzymać timer');
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    tauriWindow.showToast(translate(locale, 'common', 'CopiedToClipboard', customTranslations));
  };

  return {
    ...appSettings,
    ...timeTicker,
    ...apiSync,
    ...timeLogData,
    ...tauriWindow,

    localePref, setLocalePref,
    locale, setLocale,
    customTranslations, setCustomTranslations,

    activeTab, setActiveTab,
    alwaysOnTopConfig: getAlwaysOnTopConfig(),
    isMediumHeaderOpen, setIsMediumHeaderOpen,
    editingTranslationKey, setEditingTranslationKey,
    editingTranslationValue, setEditingTranslationValue,

    handleToggleTimer,
    handleCopyText,
  };
};
