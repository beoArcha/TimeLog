import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import { useCliSession } from '../context/CliSessionContext';

export interface UseCliDrawerProps {
  onClose?: () => void;
}

export const useCliDrawer = ({ onClose }: UseCliDrawerProps = {}) => {
  const { locale, customTranslations } = useLocale();
  const session = useCliSession();
  const [input, setInput] = useState('');
  const historyRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    session.setDrawerOpen(false);
    onClose?.();
  }, [onClose, session]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [session.terminalHistory]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    session.executeCommand(input);
    setInput('');
  }, [input, session]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCtrlL = (e.key === 'l' || e.key === 'L') && (e.ctrlKey || e.metaKey);
    if (isCtrlL) {
      e.preventDefault();
      session.clearHistory();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const previousCmd = session.navigateHistory('up', input);
      setInput(previousCmd);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextCmd = session.navigateHistory('down', input);
      setInput(nextCmd);
    }
  }, [input, session]);

  const title = translate(locale, 'cli', 'CliDrawerTitle', customTranslations);
  const closeLabel = translate(locale, 'cli', 'CloseDrawer', customTranslations);
  const liveBadge = translate(locale, 'cli', 'LiveEngineBadge', customTranslations);
  const sandboxBadge = translate(locale, 'cli', 'SandboxBadge', customTranslations);
  const placeholder = translate(locale, 'cli', 'CommandInputPlaceholder', customTranslations);
  const submitLabel = translate(locale, 'common', 'Send', customTranslations);
  const quickShortcutsTitle = translate(locale, 'help', 'QuickShortcuts', customTranslations);

  return {
    input,
    setInput,
    historyRef,
    isDrawerOpen: session.isDrawerOpen,
    isSandbox: session.isSandbox,
    terminalHistory: session.terminalHistory,
    executeCommand: session.executeCommand,
    handleClose,
    handleSubmit,
    handleInputKeyDown,
    title,
    closeLabel,
    liveBadge,
    sandboxBadge,
    placeholder,
    submitLabel,
    quickShortcutsTitle,
  };
};
