import React from 'react';
import { Terminal } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { Caption, MonoText } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { ShortcutTile } from './ShortcutTile';

export function KeyboardShortcutsCard() {
  const { locale, customTranslations } = useLocale();
  const { canUseCli } = usePlatformCapabilities();
  return (
    <CollapsibleCard
      title={translate(locale, 'help', 'ShortcutsTitle', customTranslations)}
      icon={Terminal}
      iconColor="text-emerald-500"
      defaultExpanded={false}
    >
      <Caption size="xs" className="leading-relaxed font-sans">
        {translate(locale, 'help', 'ShortcutsDesc', customTranslations)}
      </Caption>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <ShortcutTile
          label={translate(locale, 'help', 'ShortcutToggleInterface', customTranslations)}
          shortcut={
            <kbd className="text-xs font-mono px-2 py-1 rounded border border-border bg-muted text-foreground">
              ESC / X
            </kbd>
          }
        />
        <ShortcutTile
          label={translate(locale, 'help', 'ShortcutGlobalReturn', customTranslations)}
          shortcut={
            <kbd className="text-xs font-mono px-2 py-1 rounded border border-border bg-muted text-foreground">
              CTRL + SHIFT + O
            </kbd>
          }
        />
        <ShortcutTile
          variant="danger"
          label={translate(locale, 'help', 'ShortcutEmergencyStop', customTranslations)}
          shortcut={
            <kbd className="text-xs font-mono px-2 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400">
              CTRL + SHIFT + X
            </kbd>
          }
        />
        <ShortcutTile
          label={translate(locale, 'help', 'ShortcutToggleTimer', customTranslations)}
          shortcut={
            <HStack gap="xs">
              <kbd className="text-xs font-mono px-2 py-1 rounded border border-border bg-muted text-foreground">
                SPACE
              </kbd>
              <kbd className="text-xs font-mono px-2 py-1 rounded border border-border bg-muted text-foreground">
                CTRL + SPACE
              </kbd>
            </HStack>
          }
        />
        {canUseCli && (
          <ShortcutTile
            variant="warning"
            label={translate(locale, 'help', 'ShortcutSystemCli', customTranslations)}
            shortcut={
              <MonoText size="2xs" className="text-amber-500">
                oxy timer start --task &lt;id&gt;
              </MonoText>
            }
          />
        )}
      </div>
    </CollapsibleCard>
  );
}

export default KeyboardShortcutsCard;
