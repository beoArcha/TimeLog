import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Heading, Caption } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { CompilationGuideCard } from './components/CompilationGuideCard';
import { KeyboardShortcutsCard } from './components/KeyboardShortcutsCard';
import type { SupportedOs } from './components/OsSelector';

export default function ManualTab() {
  const { locale, customTranslations } = useLocale();
  const [currentOs, setCurrentOs] = useState<SupportedOs>('windows');

  const handleSelectOs = (os: SupportedOs) => {
    setCurrentOs(os);
    toast.success(translate(locale, 'help', 'OsSelected', customTranslations) + ": " + os.toUpperCase());
  };

  return (
    <div className="text-left flex flex-col gap-6 pb-10">
      <div className="border-b border-border pb-3">
        <Heading level={2} className="text-lg font-bold flex items-center gap-2 text-foreground">
          <BookOpen className="w-5 h-5 text-rose-500" />
          <span>{translate(locale, 'help', 'Title', customTranslations)}</span>
        </Heading>
        <Caption size="xs">{translate(locale, 'help', 'Description', customTranslations)}</Caption>
      </div>

      <CompilationGuideCard
        currentOs={currentOs}
        onSelectOs={handleSelectOs}
      />

      <KeyboardShortcutsCard />
    </div>
  );
}
