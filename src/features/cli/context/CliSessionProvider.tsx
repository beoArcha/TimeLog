import React, { useState, useCallback, useEffect, useMemo, useRef, useContext } from 'react';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { useDataSafe } from '@common/hooks/DataContext';
import { SettingsContext } from '@common/hooks/SettingsContext';
import { translate } from '@common/i18n/translator';
import versionsData from '@app/versions.json';
import { executeCliCommand } from '../utils/cliEngine';
import { SandboxEmulatorStore } from '../sandbox/sandboxEmulatorStore';
import { TerminalLine, CliEngineContext } from '../types';
import { CliSessionContext, CliSessionState } from './CliSessionContext';

export interface CliSessionProviderProps {
  children: React.ReactNode;
  initialHistory?: TerminalLine[];
  initialSandbox?: boolean;
  initialDrawerOpen?: boolean;
  contextOverrides?: Partial<CliEngineContext>;
}

const buildDefaultHistory = (): TerminalLine[] => [
  { text: `LogTime by OxyFlow CLI Engine [Version ${versionsData.major}.${versionsData.minor}.${versionsData.release}]`, type: 'info' },
  { text: "Type 'help' to see available commands.", type: 'info' },
  { text: "Connected to local SQLite database in memory.", type: 'success' },
  { text: '', type: 'output' },
];

export const CliSessionProvider: React.FC<CliSessionProviderProps> = ({
  children,
  initialHistory,
  initialSandbox,
  initialDrawerOpen = false,
  contextOverrides,
}) => {
  const { locale, customTranslations } = useLocale();
  const { nowIso: ambientNowIso } = useWindowShell();
  const ambientData = useDataSafe();
  const settingsContext = useContext(SettingsContext);

  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>(
    () => initialHistory ?? buildDefaultHistory()
  );
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyIndexRef = useRef<number>(-1);
  const draftInputRef = useRef<string>('');

  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() => {
    if (initialSandbox !== undefined) return initialSandbox;
    return SandboxEmulatorStore.getInstance().isActive();
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(initialDrawerOpen);

  const prevLocaleRef = useRef(locale);
  useEffect(() => {
    if (prevLocaleRef.current !== locale) {
      prevLocaleRef.current = locale;
      const msg = translate(locale, 'cli', 'LocaleSwitched', customTranslations, { locale: locale.toUpperCase() });
      setTerminalHistory(prev => [
        ...prev,
        { text: `[SYSTEM_EVENT] ${msg}`, type: 'success' },
      ]);
    }
  }, [locale, customTranslations]);

  const setSandboxMode = useCallback((active: boolean) => {
    setIsSandboxMode(active);
    if (active) {
      SandboxEmulatorStore.getInstance().enable();
    } else {
      SandboxEmulatorStore.getInstance().disable();
    }
    contextOverrides?.onToggleSandbox?.(active);
  }, [contextOverrides]);

  const setDrawerOpen = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
    if (open && settingsContext?.layoutVariant === 'compact') {
      settingsContext.setLayoutVariant('medium');
    }
  }, [settingsContext]);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => {
      const next = !prev;
      if (next && settingsContext?.layoutVariant === 'compact') {
        settingsContext.setLayoutVariant('medium');
      }
      return next;
    });
  }, [settingsContext]);

  const clearHistory = useCallback(() => {
    setTerminalHistory([]);
  }, []);

  const executeCommand = useCallback(async (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (trimmed) {
      setCommandHistory(prev => [...prev, cmdText]);
      historyIndexRef.current = -1;
      setHistoryIndex(-1);
      draftInputRef.current = '';
    }

    const cliContext: CliEngineContext = {
      projects: contextOverrides?.projects ?? ambientData?.projects ?? [],
      tasks: contextOverrides?.tasks ?? ambientData?.tasks ?? [],
      logs: contextOverrides?.logs ?? ambientData?.logs ?? [],
      activeLog: contextOverrides?.activeLog !== undefined ? contextOverrides.activeLog : (ambientData?.activeLog ?? null),
      metrics: contextOverrides?.metrics !== undefined ? contextOverrides.metrics : (ambientData?.computedMetrics ?? null),
      nowIso: contextOverrides?.nowIso ?? ambientNowIso,
      locale: contextOverrides?.locale ?? locale,
      customTranslations: contextOverrides?.customTranslations ?? customTranslations,
      holidays: contextOverrides?.holidays ?? ambientData?.holidays ?? [],
      setHolidays: contextOverrides?.setHolidays ?? ambientData?.setHolidays ?? (() => {}),
      selectedTaskId: contextOverrides?.selectedTaskId !== undefined ? contextOverrides.selectedTaskId : (ambientData?.selectedTaskId ?? null),
      setSelectedTaskId: contextOverrides?.setSelectedTaskId ?? ambientData?.setSelectedTaskId ?? (() => {}),
      onAddProject: contextOverrides?.onAddProject ?? ambientData?.handleAddProject ?? (() => {}),
      onRenameProject: contextOverrides?.onRenameProject ?? ambientData?.handleRenameProject ?? (() => {}),
      onAddTask: contextOverrides?.onAddTask ?? ambientData?.handleAddTask ?? (() => {}),
      onRenameTask: contextOverrides?.onRenameTask ?? ambientData?.handleRenameTask ?? (() => {}),
      onToggleTaskComplete: contextOverrides?.onToggleTaskComplete ?? ambientData?.handleToggleTaskComplete ?? (() => {}),
      onStartTimer: contextOverrides?.onStartTimer ?? ambientData?.handleStartTimer ?? (() => {}),
      onStopTimer: contextOverrides?.onStopTimer ?? ambientData?.handleStopTimer ?? (() => {}),
      isSandbox: isSandboxMode,
      onToggleSandbox: setSandboxMode,
      onSwitchTask: contextOverrides?.onSwitchTask,
      onRefreshData: ambientData?.refreshData,
    };

    const outputs = await executeCliCommand(cmdText, cliContext);
    if (outputs.length === 1 && outputs[0].text === '__CLEAR__') {
      setTerminalHistory([]);
      return;
    }
    setTerminalHistory(prev => [...prev, ...outputs]);
  }, [ambientData, ambientNowIso, contextOverrides, customTranslations, isSandboxMode, locale, setSandboxMode]);

  const navigateHistory = useCallback((direction: 'up' | 'down', currentInput: string): string => {
    if (commandHistory.length === 0) return currentInput;

    if (direction === 'up') {
      if (historyIndexRef.current === -1) {
        draftInputRef.current = currentInput;
        const newIndex = commandHistory.length - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        return commandHistory[newIndex];
      }
      if (historyIndexRef.current > 0) {
        const newIndex = historyIndexRef.current - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        return commandHistory[newIndex];
      }
      return commandHistory[0];
    }

    if (direction === 'down') {
      if (historyIndexRef.current === -1) return currentInput;
      if (historyIndexRef.current < commandHistory.length - 1) {
        const newIndex = historyIndexRef.current + 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        return commandHistory[newIndex];
      }
      historyIndexRef.current = -1;
      setHistoryIndex(-1);
      return draftInputRef.current;
    }

    return currentInput;
  }, [commandHistory]);

  const toggleSandbox = useCallback(() => {
    setSandboxMode(!isSandboxMode);
  }, [isSandboxMode, setSandboxMode]);

  const value = useMemo<CliSessionState>(() => ({
    terminalHistory,
    commandHistory,
    historyIndex,
    isSandbox: isSandboxMode,
    isDrawerOpen,
    executeCommand,
    toggleDrawer,
    setDrawerOpen,
    clearHistory,
    setSandboxMode,
    toggleSandbox,
    navigateHistory,
  }), [
    terminalHistory,
    commandHistory,
    historyIndex,
    isSandboxMode,
    isDrawerOpen,
    executeCommand,
    toggleDrawer,
    setDrawerOpen,
    clearHistory,
    setSandboxMode,
    toggleSandbox,
    navigateHistory,
  ]);

  return (
    <CliSessionContext.Provider value={value}>
      {children}
    </CliSessionContext.Provider>
  );
};
