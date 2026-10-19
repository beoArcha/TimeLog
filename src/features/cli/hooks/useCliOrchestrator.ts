import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { useDataSafe } from '@common/hooks/DataContext';
import { translate } from '@common/i18n/translator';
import versionsData from '@app/versions.json';
import { executeCliCommand } from '../utils/cliEngine';
import { SandboxEmulatorStore } from '../sandbox/sandboxEmulatorStore';
import { TerminalLine, CliEngineContext } from '../types';

export const useCliOrchestrator = (props?: Partial<CliEngineContext>) => {
  const { locale: ambientLocale, customTranslations: ambientCustomTranslations } = useLocale();
  const { nowIso: ambientNowIso } = useWindowShell();
  const ambientData = useDataSafe();

  const locale = props?.locale ?? ambientLocale;
  const customTranslations = props?.customTranslations ?? ambientCustomTranslations;
  const nowIso = props?.nowIso ?? ambientNowIso;

  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(
    props?.isSandbox ?? SandboxEmulatorStore.getInstance().isActive()
  );

  const [input, setInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: `LogTime by OxyFlow CLI Engine [Version ${versionsData.major}.${versionsData.minor}.${versionsData.release}]`, type: 'info' },
    { text: "Type 'help' to see available commands.", type: 'info' },
    { text: "Connected to local SQLite database in memory.", type: 'success' },
    { text: '', type: 'output' },
  ]);

  const terminalHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalHistoryRef.current) {
      terminalHistoryRef.current.scrollTop = terminalHistoryRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const [prevLocale, setPrevLocale] = useState(locale);

  if (prevLocale !== locale) {
    setPrevLocale(locale);
    const msg = translate(locale, 'cli', 'LocaleSwitched', customTranslations, { locale: locale.toUpperCase() });
    setTerminalHistory(prev => [
      ...prev,
      { text: `[SYSTEM_EVENT] ${msg}`, type: 'success' }
    ]);
  }

  const handleToggleSandbox = useCallback((enabled?: boolean) => {
    const nextState = enabled !== undefined ? enabled : !isSandboxMode;
    setIsSandboxMode(nextState);
    if (nextState) {
      SandboxEmulatorStore.getInstance().enable();
    } else {
      SandboxEmulatorStore.getInstance().disable();
    }
    props?.onToggleSandbox?.(nextState);
  }, [isSandboxMode, props]);

  const executeCommand = useCallback(async (cmdText: string) => {
    const cliContext: CliEngineContext = {
      projects: props?.projects ?? ambientData?.projects ?? [],
      tasks: props?.tasks ?? ambientData?.tasks ?? [],
      logs: props?.logs ?? ambientData?.logs ?? [],
      activeLog: props?.activeLog !== undefined ? props.activeLog : (ambientData?.activeLog ?? null),
      metrics: props?.metrics !== undefined ? props.metrics : (ambientData?.computedMetrics ?? null),
      nowIso,
      locale,
      customTranslations,
      holidays: props?.holidays ?? ambientData?.holidays ?? [],
      setHolidays: props?.setHolidays ?? ambientData?.setHolidays ?? (() => {}),
      selectedTaskId: props?.selectedTaskId !== undefined ? props.selectedTaskId : (ambientData?.selectedTaskId ?? null),
      setSelectedTaskId: props?.setSelectedTaskId ?? ambientData?.setSelectedTaskId ?? (() => {}),
      onAddProject: props?.onAddProject ?? ambientData?.handleAddProject ?? (() => {}),
      onRenameProject: props?.onRenameProject ?? ambientData?.handleRenameProject ?? (() => {}),
      onAddTask: props?.onAddTask ?? ambientData?.handleAddTask ?? (() => {}),
      onRenameTask: props?.onRenameTask ?? ambientData?.handleRenameTask ?? (() => {}),
      onToggleTaskComplete: props?.onToggleTaskComplete ?? ambientData?.handleToggleTaskComplete ?? (() => {}),
      onStartTimer: props?.onStartTimer ?? ambientData?.handleStartTimer ?? (() => {}),
      onStopTimer: props?.onStopTimer ?? ambientData?.handleStopTimer ?? (() => {}),
      isSandbox: isSandboxMode,
      onToggleSandbox: handleToggleSandbox,
      onSwitchTask: props?.onSwitchTask,
    };

    const outputs = await executeCliCommand(cmdText, cliContext);
    if (outputs.length === 1 && outputs[0].text === '__CLEAR__') {
      setTerminalHistory([]);
      return;
    }
    setTerminalHistory(prev => [...prev, ...outputs]);
  }, [ambientData, customTranslations, handleToggleSandbox, isSandboxMode, locale, nowIso, props]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input);
    setInput('');
  }, [executeCommand, input]);

  const placeholder = translate(locale, 'cli', 'CommandInputPlaceholder', customTranslations);
  const submitLabel = translate(locale, 'common', 'Send', customTranslations);
  const quickShortcutsTitle = translate(locale, 'help', 'QuickShortcuts', customTranslations);

  return {
    input,
    setInput,
    history: terminalHistory,
    historyRef: terminalHistoryRef,
    executeCommand,
    handleFormSubmit,
    placeholder,
    submitLabel,
    quickShortcutsTitle,
    isSandbox: isSandboxMode,
    toggleSandbox: handleToggleSandbox,
  };
};
