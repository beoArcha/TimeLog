import React from 'react';
import { AppWindow } from 'lucide-react';
import { Button } from '@components/ui/button';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';

export interface RestoreButtonProps {
  setIsMinimized: (val: boolean) => void;
  showToast: (msg: string) => void;
}

/**
 * Floating button to restore minimized application view from tray mode.
 */
export default function RestoreButton({ setIsMinimized, showToast }: RestoreButtonProps) {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-bounce">
      <Button
        id="tray-dot-restore-button"
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsMinimized(false);
          showToast(translate(locale, 'app', 'DefaultRestored', customTranslations));
        }}
        className="w-14 h-14 bg-gradient-to-tr from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-white shadow-2xl border border-white/20 cursor-pointer transform hover:scale-110 active:scale-95 transition-all p-0"
        title={translate(locale, 'app', 'RestoreDefault', customTranslations)}
        aria-label={translate(locale, 'app', 'RestoreDefault', customTranslations)}
      >
        <AppWindow className="w-6 h-6 text-white" />
      </Button>
    </div>
  );
}
