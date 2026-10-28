import { useState, useEffect, useCallback } from 'react';
import { Settings as AppSettings } from '@bindings/Settings';
import { LayoutVariant } from '@bindings/LayoutVariant';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { Theme, ThemePreference } from '@common/types/ThemeTypes';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { ThemeRegistry } from '@/src/styles/themeRegistry';
import { LAYOUT_VARIANTS, isCompactLayout } from '@common/constants/layoutVariants';
import { AppTabId } from '@common/types/navigation';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { toast } from 'sonner';

export const useAppSettings = () => {
  const { supportedLayouts, defaultLayout } = usePlatformCapabilities();
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [textAndIconSize, setTextAndIconSize] = useState<TextAndIconSize>('medium');
  const [storedLayoutVariant, setStoredLayoutVariant] = useState<LayoutVariant>(
    defaultLayout || LAYOUT_VARIANTS.FULL
  );
  const [alwaysOnTopSmall, setAlwaysOnTopSmall] = useState<boolean>(false);
  const [alwaysOnTopMain, setAlwaysOnTopMain] = useState<boolean>(false);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(true);
  const [sysSettings, setSysSettings] = useState<AppSettings>({
    autoStart: false,
    includePatchesInReports: true,
    activeSinks: ['Csv'],
  });

  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [lastNonCompactVariant, setLastNonCompactVariant] = useState<Exclude<LayoutVariant, 'compact'>>(
    LAYOUT_VARIANTS.FULL
  );
  const [activeLargeTab, setActiveLargeTab] = useState<AppTabId>('tasks');
  const [isCompactExpanded, setIsCompactExpanded] = useState<boolean>(true);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');

  const effectiveLayoutVariant: LayoutVariant = supportedLayouts.includes(storedLayoutVariant)
    ? storedLayoutVariant
    : (defaultLayout || LAYOUT_VARIANTS.FULL);

  const setLayoutVariant = useCallback((variant: LayoutVariant) => {
    if (supportedLayouts.includes(variant)) {
      setStoredLayoutVariant(variant);
    }
  }, [supportedLayouts]);

  useEffect(() => {
    Promise.all([
      PersistenceRouter.getInstance().settings.get(),
      PersistenceRouter.getInstance().uiState.getCurrentProjectId(),
      PersistenceRouter.getInstance().uiState.getLastNonCompactVariant(),
    ]).then(([loaded, currentProj, lastNonCompact]) => {
      setTheme((loaded.theme as ThemePreference) || 'system');
      setTextAndIconSize((loaded.textAndIconSize as TextAndIconSize) || 'medium');
      const rawVariant = (loaded.guiVariant as LayoutVariant) || defaultLayout || LAYOUT_VARIANTS.FULL;
      const initialVariant = supportedLayouts.includes(rawVariant)
        ? rawVariant
        : (defaultLayout || LAYOUT_VARIANTS.FULL);
      setStoredLayoutVariant(initialVariant);
      setAlwaysOnTopSmall(loaded.alwaysOnTopSmall ?? false);
      setAlwaysOnTopMain(loaded.alwaysOnTopMain ?? false);
      setMinimizeToTray(loaded.minimizeToTray ?? true);
      setSysSettings({
        autoStart: loaded.autoStart ?? false,
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
  }, [defaultLayout, supportedLayouts]);

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

  useEffect(() => {
    ThemeRegistry.getInstance().applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  if (!isCompactLayout(effectiveLayoutVariant) && effectiveLayoutVariant !== lastNonCompactVariant) {
    setLastNonCompactVariant(effectiveLayoutVariant as Exclude<LayoutVariant, 'compact'>);
  }

  useEffect(() => {
    if (settingsLoaded) {
      PersistenceRouter.getInstance().uiState.saveLastNonCompactVariant(lastNonCompactVariant).catch(ErrorHandler.handle);
    }
  }, [lastNonCompactVariant, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    const saveSettings = async () => {
      const payload: AppSettings = {
        autoStart: sysSettings.autoStart,
        includePatchesInReports: sysSettings.includePatchesInReports,
        activeSinks: sysSettings.activeSinks || ['Csv'],
        theme: theme,
        textAndIconSize: textAndIconSize,
        guiVariant: effectiveLayoutVariant,
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
    effectiveLayoutVariant,
    alwaysOnTopSmall,
    alwaysOnTopMain,
    minimizeToTray,
  ]);

  useEffect(() => {
    if (settingsLoaded && currentProjectId) {
      PersistenceRouter.getInstance().uiState.saveCurrentProjectId(currentProjectId).catch(ErrorHandler.handle);
    }
  }, [currentProjectId, settingsLoaded]);

  const [defaultProjectConcurrency, setDefaultProjectConcurrencyState] = useState<boolean>(() => {
    return localStorage.getItem('oxy_default_project_concurrency') === 'true';
  });

  const setDefaultProjectConcurrency = (val: boolean) => {
    setDefaultProjectConcurrencyState(val);
    localStorage.setItem('oxy_default_project_concurrency', String(val));
  };

  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);

  return {
    theme, setTheme,
    textAndIconSize, setTextAndIconSize,
    resolvedTheme, setResolvedTheme,
    sysSettings, setSysSettings,
    layoutVariant: effectiveLayoutVariant, setLayoutVariant,
    lastNonCompactVariant, setLastNonCompactVariant,
    alwaysOnTopSmall, setAlwaysOnTopSmall,
    alwaysOnTopMain, setAlwaysOnTopMain,
    activeLargeTab, setActiveLargeTab,
    isCompactExpanded, setIsCompactExpanded,
    currentProjectId, setCurrentProjectId,
    showCreditsModal, setShowCreditsModal,
    minimizeToTray, setMinimizeToTray,
    defaultProjectConcurrency, setDefaultProjectConcurrency
  };
};
