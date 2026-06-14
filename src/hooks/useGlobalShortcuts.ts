import { useEffect } from 'react';

export function useGlobalShortcuts({
  onToggleTimer,
}: {
  onToggleTimer: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in inputs or interacting with buttons via keyboard
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.isContentEditable;

      // Space to toggle timer (if not in input)
      if (e.code === 'Space' && !isInput) {
        e.preventDefault(); // Prevent page scroll
        onToggleTimer();
      }

      // Ctrl + Space to toggle timer universally
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        onToggleTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleTimer]);
}
