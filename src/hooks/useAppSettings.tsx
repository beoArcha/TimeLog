import { useState, useEffect } from 'react';
import { Settings as AppSettings } from '../types';
import { GuiSize } from '../bindings/GuiSize';
import { TextAndIconSize } from '../bindings/TextAndIconSize';

export const useAppSettings = () => {
  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast' | 'system'>(() => {
    const saved = localStorage.getItem('oxytime_theme');
    return (saved as any) || 'system';
  });

  const [textAndIconSize, setTextAndIconSize] = useState<TextAndIconSize>(() => {
    const saved = localStorage.getItem('oxytime_text_icon_size');
    return (saved as TextAndIconSize) || 'medium';
  });

  useEffect(() => {
    localStorage.setItem('oxytime_text_icon_size', textAndIconSize);
  }, [textAndIconSize]);

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark');

  useEffect(() => {
    localStorage.setItem('oxytime_theme', theme);
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const handleChange = () => {
        setResolvedTheme(mediaQuery.matches ? 'light' : 'dark');
      };
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme as any);
    }
  }, [theme]);

  const [sysSettings, setSysSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('oxytime_sys_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (err) {}
    }
    return { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: true };
  });

  useEffect(() => {
    localStorage.setItem('oxytime_sys_settings', JSON.stringify(sysSettings));
  }, [sysSettings]);

  const [guiSize, setGuiSize] = useState<GuiSize>(() => {
    return (localStorage.getItem('oxytime_gui_variant') as GuiSize) || 'large';
  });

  const [lastNonSmallVariant, setLastNonSmallVariant] = useState<Exclude<GuiSize, 'small'>>(() => {
    const saved = localStorage.getItem('oxytime_last_non_small_variant');
    return (saved as Exclude<GuiSize, 'small'>) || 'large';
  });

  useEffect(() => {
    localStorage.setItem('oxytime_gui_variant', guiSize);
    if (guiSize !== 'small') {
      setLastNonSmallVariant(guiSize);
      localStorage.setItem('oxytime_last_non_small_variant', guiSize);
    }
  }, [guiSize]);

  const [alwaysOnTopSmall, setAlwaysOnTopSmall] = useState<boolean>(() => {
    return localStorage.getItem('oxytime_always_on_top_small') === 'true';
  });

  const [alwaysOnTopMain, setAlwaysOnTopMain] = useState<boolean>(() => {
    return localStorage.getItem('oxytime_always_on_top_main') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('oxytime_always_on_top_small', String(alwaysOnTopSmall));
    localStorage.setItem('oxytime_always_on_top_main', String(alwaysOnTopMain));
  }, [alwaysOnTopSmall, alwaysOnTopMain]);

  const [activeLargeTab, setActiveLargeTab] = useState<'main' | 'reports' | 'db' | 'options' | 'backup' | 'cli' | 'manual' | 'credits'>('main');
  const [isSmallExpanded, setIsSmallExpanded] = useState<boolean>(true);
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem('oxytime_current_proj_id') || '1';
  });

  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('oxytime_current_proj_id', currentProjectId);
    }
  }, [currentProjectId]);

  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean>(() => localStorage.getItem('oxytime_min_to_tray') !== 'false');

  useEffect(() => {
    localStorage.setItem('oxytime_min_to_tray', String(minimizeToTray));
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
