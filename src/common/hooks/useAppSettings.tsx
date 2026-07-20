import { useState, useEffect } from 'react';
import { Settings as AppSettings } from '@bindings/Settings';
import { LayoutVariant } from '@bindings/LayoutVariant';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { Theme, ThemePreference } from '@common/types/ThemeTypes';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { toast } from 'sonner';

export const useAppSettings = () => {
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [textAndIconSize, setTextAndIconSize] = useState<TextAndIconSize>('medium');
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>('full');
  const [alwaysOnTopSmall, setAlwaysOnTopSmall] = useState<boolean>(false);
  const [alwaysOnTopMain, setAlwaysOnTopMain] = useState<boolean>(false);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(true);
  const [sysSettings, setSysSettings] = useState<AppSettings>({ autoStart: false, autoPauseOnSleep: true, includePatchesInReports: true });


  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [lastNonCompactVariant, setLastNonCompactVariant] = useState<Exclude<LayoutVariant, 'compact'>>('full');
  const [activeLargeTab, setActiveLargeTab] = useState<'main' | 'reports' | 'db' | 'options' | 'backup' | 'cli' | 'manual' | 'credits'>('main');
  const [isCompactExpanded, setIsCompactExpanded] = useState<boolean>(true);
  const [currentProjectId, setCurrentProjectId] = useState<string>('1');

  useEffect(() => {
    Promise.all([
      PersistenceRouter.getInstance().settings.get(),
      PersistenceRouter.getInstance().uiState.getCurrentProjectId(),
      PersistenceRouter.getInstance().uiState.getLastNonCompactVariant(),
    ]).then(([loaded, currentProj, lastNonCompact]) => {
      setTheme((loaded.theme as ThemePreference) || 'system');
      setTextAndIconSize((loaded.textAndIconSize as TextAndIconSize) || 'medium');
      setLayoutVariant((loaded.guiVariant as LayoutVariant) || 'full');
      setAlwaysOnTopSmall(loaded.alwaysOnTopSmall ?? false);
      setAlwaysOnTopMain(loaded.alwaysOnTopMain ?? false);
      setMinimizeToTray(loaded.minimizeToTray ?? true);
      setSysSettings({
        autoStart: loaded.autoStart ?? false,
        autoPauseOnSleep: loaded.autoPauseOnSleep ?? true,
        includePatchesInReports: loaded.includePatchesInReports ?? true,
        activeSinks: loaded.activeSinks ?? ['Csv'],
      });
      if (currentProj) setCurrentProjectId(currentProj);
      if (lastNonCompact) setLastNonCompactVariant(lastNonCompact as Exclude<LayoutVariant, 'compact'>);
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
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => setSystemTheme(mediaQuery.matches ? 'light' : 'dark');
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const resolvedTheme: Theme = theme === 'system' ? systemTheme : (theme as unknown as Theme);
  const setResolvedTheme = setSystemTheme;


  if (layoutVariant !== 'compact' && layoutVariant !== lastNonCompactVariant) {
    setLastNonCompactVariant(layoutVariant);
  }

  useEffect(() => {
    if (settingsLoaded && lastNonCompactVariant !== 'compact') {
      PersistenceRouter.getInstance().uiState.saveLastNonCompactVariant(lastNonCompactVariant).catch(ErrorHandler.handle);
    }
  }, [lastNonCompactVariant, settingsLoaded]);

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


  useEffect(() => {
    if (settingsLoaded && currentProjectId) {
      PersistenceRouter.getInstance().uiState.saveCurrentProjectId(currentProjectId).catch(ErrorHandler.handle);
    }
  }, [currentProjectId, settingsLoaded]);

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
