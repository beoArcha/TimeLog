import { useState, useEffect } from 'react';
import { Settings as AppSettings } from '@bindings/Settings';
import { GuiSize } from '@bindings/GuiSize';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { STORAGE_KEYS } from '@common/constants';

type ThemePref = 'dark' | 'light' | 'high-contrast' | 'system';
type ResolvedTheme = 'dark' | 'light' | 'high-contrast';

export const useAppSettings = () => {
  const [theme, setTheme] = useState<ThemePref>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as ThemePref) || 'system';
  });

  const [textAndIconSize, setTextAndIconSize] = useState<TextAndIconSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEXT_ICON_SIZE);
    return (saved as TextAndIconSize) || 'medium';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEXT_ICON_SIZE, textAndIconSize);
  }, [textAndIconSize]);

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => setSystemTheme(mediaQuery.matches ? 'light' : 'dark');
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;
  const setResolvedTheme = setSystemTheme;

  const [sysSettings, setSysSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYS_SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }
    return { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: true };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYS_SETTINGS, JSON.stringify(sysSettings));
  }, [sysSettings]);

  const [guiSize, setGuiSize] = useState<GuiSize>(() => {
    return (localStorage.getItem(STORAGE_KEYS.GUI_VARIANT) as GuiSize) || 'large';
  });

  const [lastNonSmallVariant, setLastNonSmallVariant] = useState<Exclude<GuiSize, 'small'>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_NON_SMALL_VARIANT);
    return (saved as Exclude<GuiSize, 'small'>) || 'large';
  });

  if (guiSize !== 'small' && guiSize !== lastNonSmallVariant) {
    setLastNonSmallVariant(guiSize);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GUI_VARIANT, guiSize);
    if (guiSize !== 'small') {
      localStorage.setItem(STORAGE_KEYS.LAST_NON_SMALL_VARIANT, guiSize);
    }
  }, [guiSize]);

  const [alwaysOnTopSmall, setAlwaysOnTopSmall] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ALWAYS_ON_TOP_SMALL) === 'true';
  });

  const [alwaysOnTopMain, setAlwaysOnTopMain] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ALWAYS_ON_TOP_MAIN) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALWAYS_ON_TOP_SMALL, String(alwaysOnTopSmall));
    localStorage.setItem(STORAGE_KEYS.ALWAYS_ON_TOP_MAIN, String(alwaysOnTopMain));
  }, [alwaysOnTopSmall, alwaysOnTopMain]);

  const [activeLargeTab, setActiveLargeTab] = useState<'main' | 'reports' | 'db' | 'options' | 'backup' | 'cli' | 'manual' | 'credits'>('main');
  const [isSmallExpanded, setIsSmallExpanded] = useState<boolean>(true);
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJ_ID) || '1';
  });

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJ_ID, currentProjectId);
    }
  }, [currentProjectId]);

  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(() => localStorage.getItem(STORAGE_KEYS.MIN_TO_TRAY) !== 'false');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MIN_TO_TRAY, String(minimizeToTray));
  }, [minimizeToTray]);

  return {
    theme, setTheme,
    textAndIconSize, setTextAndIconSize,
    resolvedTheme, setResolvedTheme,
    sysSettings, setSysSettings,
    guiSize, setGuiSize,
    lastNonSmallVariant, setLastNonSmallVariant,
    alwaysOnTopSmall, setAlwaysOnTopSmall,
    alwaysOnTopMain, setAlwaysOnTopMain,
    activeLargeTab, setActiveLargeTab,
    isSmallExpanded, setIsSmallExpanded,
    currentProjectId, setCurrentProjectId,
    showCreditsModal, setShowCreditsModal,
    minimizeToTray, setMinimizeToTray
  };
};
