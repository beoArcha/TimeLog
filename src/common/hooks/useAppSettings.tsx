import { useState, useEffect } from 'react';
import { Settings as AppSettings } from '@bindings/Settings';
import { GuiSize } from '@bindings/GuiSize';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { STORAGE_KEYS } from '@common/constants';
import { Theme, ThemePreference } from '@common/types/ThemeTypes';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';

export const useAppSettings = () => {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as ThemePreference) || 'system';
  });

  const [textAndIconSize, setTextAndIconSize] = useState<TextAndIconSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEXT_ICON_SIZE);
    return (saved as TextAndIconSize) || 'medium';
  });

  const [guiSize, setGuiSize] = useState<GuiSize>(() => {
    return (localStorage.getItem(STORAGE_KEYS.GUI_VARIANT) as GuiSize) || 'large';
  });

  const [alwaysOnTopSmall, setAlwaysOnTopSmall] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ALWAYS_ON_TOP_SMALL) === 'true';
  });

  const [alwaysOnTopMain, setAlwaysOnTopMain] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ALWAYS_ON_TOP_MAIN) === 'true';
  });

  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.MIN_TO_TRAY) !== 'false';
  });

  const [sysSettings, setSysSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYS_SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (_e) { /* ignore parse errors and fall back to default settings */ }
    }
    return { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: true };
  });

  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // 1. Initial async load from Persistence Layer
  useEffect(() => {
    PersistenceRouter.getInstance().settings.get().then((loaded) => {
      setTheme(loaded.theme as ThemePreference);
      setTextAndIconSize(loaded.textAndIconSize);
      setGuiSize(loaded.guiVariant);
      setAlwaysOnTopSmall(loaded.alwaysOnTopSmall);
      setAlwaysOnTopMain(loaded.alwaysOnTopMain);
      setMinimizeToTray(loaded.minimizeToTray);
      setSysSettings({
        autoStart: loaded.autoStart,
        autoPauseOnSleep: loaded.autoPauseOnSleep,
        includePatchesInReports: loaded.includePatchesInReports,
        activeSinks: loaded.activeSinks,
      });
      setSettingsLoaded(true);
    }).catch(err => {
      console.warn('Failed to load settings from persistence router:', err);
      setSettingsLoaded(true);
    });
  }, []);

  // 2. LocalStorage fast-path fallback sync & Theme setup
  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
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

  const resolvedTheme: Theme = theme === 'system' ? systemTheme : (theme as unknown as Theme);
  const setResolvedTheme = setSystemTheme;

  const [lastNonSmallVariant, setLastNonSmallVariant] = useState<Exclude<GuiSize, 'small'>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_NON_SMALL_VARIANT);
    return (saved as Exclude<GuiSize, 'small'>) || 'large';
  });

  if (guiSize !== 'small' && guiSize !== lastNonSmallVariant) {
    setLastNonSmallVariant(guiSize);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEXT_ICON_SIZE, textAndIconSize);
  }, [textAndIconSize]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GUI_VARIANT, guiSize);
    if (guiSize !== 'small') {
      localStorage.setItem(STORAGE_KEYS.LAST_NON_SMALL_VARIANT, guiSize);
    }
  }, [guiSize]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALWAYS_ON_TOP_SMALL, String(alwaysOnTopSmall));
    localStorage.setItem(STORAGE_KEYS.ALWAYS_ON_TOP_MAIN, String(alwaysOnTopMain));
  }, [alwaysOnTopSmall, alwaysOnTopMain]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MIN_TO_TRAY, String(minimizeToTray));
  }, [minimizeToTray]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SYS_SETTINGS, JSON.stringify(sysSettings));
  }, [sysSettings]);

  // 3. Persist back to the Persistence layer upon changes
  useEffect(() => {
    if (!settingsLoaded) return;
    const saveSettings = async () => {
      const payload: AppSettings = {
        autoStart: sysSettings.autoStart,
        autoPauseOnSleep: sysSettings.autoPauseOnSleep,
        includePatchesInReports: sysSettings.includePatchesInReports,
        activeSinks: sysSettings.activeSinks || ['Csv'],
        theme: theme,
        textAndIconSize: textAndIconSize,
        guiVariant: guiSize,
        alwaysOnTopSmall: alwaysOnTopSmall,
        alwaysOnTopMain: alwaysOnTopMain,
        minimizeToTray: minimizeToTray,
      };
      await PersistenceRouter.getInstance().settings.save(payload);
    };
    saveSettings().catch((e) => console.error("Failed to save settings to persistence:", e));
  }, [
    settingsLoaded,
    sysSettings,
    theme,
    textAndIconSize,
    guiSize,
    alwaysOnTopSmall,
    alwaysOnTopMain,
    minimizeToTray,
  ]);

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
