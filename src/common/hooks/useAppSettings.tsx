import { useState, useEffect } from 'react';
import { Settings as AppSettings } from '@bindings/Settings';
import { LayoutVariant } from '@bindings/LayoutVariant';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { STORAGE_KEYS } from '@common/constants';
import { Theme, ThemePreference } from '@common/types/ThemeTypes';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { toast } from 'sonner';

export const useAppSettings = () => {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as ThemePreference) || 'system';
  });

  const [textAndIconSize, setTextAndIconSize] = useState<TextAndIconSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEXT_ICON_SIZE);
    return (saved as TextAndIconSize) || 'medium';
  });

  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>(() => {
    return (localStorage.getItem(STORAGE_KEYS.GUI_VARIANT) as LayoutVariant) || 'full';
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

  useEffect(() => {
    PersistenceRouter.getInstance().settings.get().then((loaded) => {
      setTheme(loaded.theme as ThemePreference);
      setTextAndIconSize(loaded.textAndIconSize);
      setLayoutVariant(loaded.guiVariant as LayoutVariant);
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
      ErrorHandler.handle(err);
      setSettingsLoaded(true);
    });
  }, []);

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

  const [lastNonCompactVariant, setLastNonCompactVariant] = useState<Exclude<LayoutVariant, 'compact'>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_NON_COMPACT_VARIANT);
    return (saved as Exclude<LayoutVariant, 'compact'>) || 'full';
  });

  if (layoutVariant !== 'compact' && layoutVariant !== lastNonCompactVariant) {
    setLastNonCompactVariant(layoutVariant);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEXT_ICON_SIZE, textAndIconSize);
  }, [textAndIconSize]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GUI_VARIANT, layoutVariant);
    if (layoutVariant !== 'compact') {
      localStorage.setItem(STORAGE_KEYS.LAST_NON_COMPACT_VARIANT, layoutVariant);
    }
  }, [layoutVariant]);

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
        guiVariant: layoutVariant,
        alwaysOnTopSmall: alwaysOnTopSmall,
        alwaysOnTopMain: alwaysOnTopMain,
        minimizeToTray: minimizeToTray,
      };
      await PersistenceRouter.getInstance().settings.save(payload);
    };
    saveSettings().catch((e) => {
      ErrorHandler.handle(e);
      toast.error('Failed to save settings to persistence');
    });
  }, [
    settingsLoaded,
    sysSettings,
    theme,
    textAndIconSize,
    layoutVariant,
    alwaysOnTopSmall,
    alwaysOnTopMain,
    minimizeToTray,
  ]);

  const [activeLargeTab, setActiveLargeTab] = useState<'main' | 'reports' | 'db' | 'options' | 'backup' | 'cli' | 'manual' | 'credits'>('main');
  const [isCompactExpanded, setIsCompactExpanded] = useState<boolean>(true);
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
    layoutVariant, setLayoutVariant,
    lastNonCompactVariant, setLastNonCompactVariant,
    alwaysOnTopSmall, setAlwaysOnTopSmall,
    alwaysOnTopMain, setAlwaysOnTopMain,
    activeLargeTab, setActiveLargeTab,
    isCompactExpanded, setIsCompactExpanded,
    currentProjectId, setCurrentProjectId,
    showCreditsModal, setShowCreditsModal,
    minimizeToTray, setMinimizeToTray
  };
};
