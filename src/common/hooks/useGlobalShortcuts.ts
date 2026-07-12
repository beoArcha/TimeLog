import { useEffect } from 'react';

interface GlobalShortcutsConfig {
  onToggleTimer: () => void;
  onSwitchTab?: (index: number) => void;
  onEscape?: () => void;
}

export function useGlobalShortcuts({
  onToggleTimer,
  onSwitchTab,
  onEscape,
}: GlobalShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.isContentEditable;

      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        onToggleTimer();
      }
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        onToggleTimer();
      }

      if (e.altKey && onSwitchTab) {
        const digitMatch = e.code.match(/^Digit([1-8])$/);
        if (digitMatch) {
          e.preventDefault();
          onSwitchTab(parseInt(digitMatch[1], 10) - 1);
        }
      }

      if (e.code === 'Escape' && !isInput && onEscape) {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleTimer, onSwitchTab, onEscape]);
}
