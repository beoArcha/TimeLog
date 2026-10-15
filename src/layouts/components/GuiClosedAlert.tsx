import React from 'react';
import { Cpu } from 'lucide-react';
import { Button } from '@components/ui/button';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useWindowShell } from '@common/contexts/WindowShellContext';

export default function GuiClosedAlert() {
  const { locale, customTranslations } = useLocale();
  const { setIsGuiClosed } = useWindowShell();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground flex-col gap-4 font-mono">
      <Cpu className="w-12 h-12 text-orange-500 animate-pulse" />
      <h1 className="text-2xl font-bold">{translate(locale, 'app', 'GuiClosedTitle', customTranslations)}</h1>
      <p className="text-muted-foreground">{translate(locale, 'app', 'GuiClosedDesc', customTranslations)}</p>
      <Button
        onClick={() => setIsGuiClosed(false)}
        className="px-6 py-2 mt-4 bg-orange-500 hover:bg-orange-600 text-black font-bold cursor-pointer transition-all"
      >
        {translate(locale, 'app', 'RestartGui', customTranslations)}
      </Button>
    </div>
  );
}
