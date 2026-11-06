import React from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Grid } from '@components/ui/grid';
import { Overline, List, ListItem, Text, Caption, MonoText } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';

export default function CreditsModal() {
  const { locale, customTranslations } = useLocale();
  const { showCreditsModal, setShowCreditsModal } = useSettings();

  if (!showCreditsModal || !setShowCreditsModal) return null;

  return (
    <Dialog
      open={Boolean(showCreditsModal)}
      onOpenChange={(open) => setShowCreditsModal(open)}
    >
      <DialogContent
        id="credits-modal-container"
        data-testid="credits-modal-container"
        showClose={false}
        className="w-full max-w-2xl rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto"
      >
        <Button
          id="close-credits-modal-btn"
          data-testid="credits-modal-close-btn"
          variant="ghost"
          size="icon"
          onClick={() => setShowCreditsModal(false)}
          className="absolute top-6 right-6 p-2 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted"
          title={translate(locale, 'common', 'Close', customTranslations)}
          aria-label={translate(locale, 'common', 'Close', customTranslations)}
        >
          <X className="w-5 h-5" />
        </Button>

        <DialogHeader className="border-b pb-4 border-border">
          <Badge variant="orange" size="sm" className="w-fit">
            {translate(locale, 'help', 'CreditsBadge', customTranslations)}
          </Badge>
          <DialogTitle
            id="credits-modal-title"
            className="font-sans font-bold text-2xl mt-2 flex items-center gap-2 text-foreground"
          >
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            {translate(locale, 'help', 'AboutFlowCreditsMpl', customTranslations)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 my-2">
          <Overline as="h4" size="xs" className="font-mono">
            🕺 {translate(locale, 'help', 'AboutCreatorVibeCodingVibe', customTranslations)}
          </Overline>
          <div className="p-5 rounded-3xl border border-border bg-muted/40 text-foreground transition-all flex flex-col gap-2.5">
            <Text size="sm" className="font-sans leading-relaxed">
              {translate(locale, 'help', 'CreatorAppCreatedBy', customTranslations)}
            </Text>
            <Caption variant="muted" className="font-sans leading-relaxed">
              {translate(locale, 'help', 'CreatorBio', customTranslations)}
            </Caption>
            <Caption variant="muted" className="font-sans leading-relaxed border-t border-border/50 pt-2.5">
              {translate(locale, 'help', 'CreatorVibeArchitecture', customTranslations)}
            </Caption>
          </div>
        </div>

        <Grid cols={1} gap="lg" className="md:grid-cols-2 my-2">
          <div className="flex flex-col gap-2">
            <Overline as="h4" size="xs" className="font-mono">
              💖 {translate(locale, 'help', 'ComponentCreatorsAcknowledgement', customTranslations)}
            </Overline>
            <List className="p-4 rounded-3xl border border-border pl-5 text-xs flex flex-col gap-1.5 leading-relaxed bg-muted/40 text-foreground max-h-[160px] overflow-y-auto">
              <ListItem>
                <strong className="text-primary">React 19</strong>:{' '}
                {translate(locale, 'help', 'ForReact19', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">@base-ui/react</strong>:{' '}
                {translate(locale, 'help', 'ForBaseUiReact', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">Tauri v2</strong>:{' '}
                {translate(locale, 'help', 'ForTauriV2', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">Recharts</strong>:{' '}
                {translate(locale, 'help', 'ForRecharts', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">Sonner</strong>:{' '}
                {translate(locale, 'help', 'ForSonner', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">Geist Font Family</strong>:{' '}
                {translate(locale, 'help', 'ForGeistFontFamily', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">Google GenAI</strong>:{' '}
                {translate(locale, 'help', 'ForGoogleGenAi', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">Motion</strong>:{' '}
                {translate(locale, 'help', 'ForCinematicReactiveStateTrans', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">Tailwind CSS v4</strong>:{' '}
                {translate(locale, 'help', 'ForRapidElegantResponsiveUtili', customTranslations)}
              </ListItem>
              <ListItem>
                <strong className="text-primary">Lucide React</strong>:{' '}
                {translate(locale, 'help', 'ForGorgeousConsistentVectorIco', customTranslations)}
              </ListItem>
            </List>
          </div>

          <div className="flex flex-col gap-2">
            <Overline as="h4" size="xs" className="font-mono">
              📄 {translate(locale, 'help', 'MplLicense', customTranslations)}
            </Overline>
            <div className="p-4 rounded-3xl border border-border text-xs font-mono leading-relaxed h-[160px] overflow-y-auto bg-muted/60 text-muted-foreground">
              <MonoText weight="bold" size="xs" className="mb-1 block">Mozilla Public License Version 2.0 (MPL-2.0)</MonoText>
              <MonoText size="xs" className="mb-2 block">Copyright (c) 2026 Marcin 'beoArcha' Stefan (oXyFlow TimeLog)</MonoText>
              <MonoText size="xs" className="mb-2 block">
                This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
                If a copy of the MPL was not distributed with this file, You can obtain one at
                https://mozilla.org/MPL/2.0/.
              </MonoText>
            </div>
          </div>
        </Grid>

        <DialogFooter className="border-t pt-4 border-border mt-2">
          <Button
            id="close-credits-overlay-btn"
            variant="accent"
            onClick={() => setShowCreditsModal(false)}
            aria-label={translate(locale, 'help', 'GreatClose', customTranslations)}
          >
            {translate(locale, 'help', 'GreatClose', customTranslations)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
