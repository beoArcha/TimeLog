import { useEffect } from 'react';

export function useGlobalShortcuts({
  onToggleTimer,
}: {
  onToggleTimer: () => void;
}) {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleTimer]);
}
