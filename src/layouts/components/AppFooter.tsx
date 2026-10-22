import React from 'react';
import { translate } from '@common/i18n/translator';
import { TranslationDictionary } from '@common/i18n/types';
import { Locale } from '@/src/bindings/Locale';
import { Button } from '@components/ui/button';
import { HStack } from '@components/ui/stack';
import { Caption, MonoText } from '@components/ui/typography';

interface AppFooterProps {
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  handleResetLocalStorage: () => void;
  setShowCreditsModal: (show: boolean) => void;
}

export default function AppFooter({
  locale,
  customTranslations,
  handleResetLocalStorage,
  setShowCreditsModal,
}: AppFooterProps) {
  return (
    <HStack
      as="footer"
      justify="between"
      gap="sm"
      className="mt-auto bg-card/60 backdrop-blur-md border-t border-border py-1.5 px-3 sm:py-2 sm:px-6 text-xs text-muted-foreground font-mono whitespace-nowrap overflow-x-auto select-none"
    >
      <HStack gap="xs" className="sm:gap-2 shrink-0">
        <MonoText as="span" size="xs" weight="semibold" className="hidden sm:inline text-foreground">
          OxyFlowOS
        </MonoText>
        <Caption as="span" size="xs" className="hidden sm:inline text-muted-foreground/60">
          Environment — SQLite MicroORM
        </Caption>
        <Caption as="span" size="xs" className="hidden sm:inline text-muted-foreground/40 select-none">
          •
        </Caption>
        <Button
          id="trigger-credits-modal-btn"
          variant="link"
          size="xs"
          onClick={() => setShowCreditsModal(true)}
          className="text-primary hover:text-primary/80 font-bold underline transition-colors cursor-pointer p-0 h-auto"
        >
          {translate(locale, 'help', 'MplLicenseCreditsOxyFlow', customTranslations)}
        </Button>
      </HStack>
      <HStack gap="sm" className="sm:gap-4 shrink-0">
        <Caption as="span" size="xs" className="hidden sm:inline">
          {translate(locale, 'engine', 'Ready', customTranslations)}
        </Caption>
        <Button
          id="db-clean-force-btn"
          variant="link"
          size="xs"
          onClick={handleResetLocalStorage}
          className="text-orange-500 hover:text-orange-400 font-bold transition-all cursor-pointer p-0 h-auto"
        >
          {translate(locale, 'engine', 'SqlReset', customTranslations)}
        </Button>
      </HStack>
    </HStack>
  );
}
