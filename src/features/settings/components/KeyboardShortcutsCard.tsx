import React from 'react';
import { Terminal } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { Caption, MonoText } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { Kbd } from '@components/ui/kbd';
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
            <Kbd>
              ESC / X
            </Kbd>
          }
        />
        <ShortcutTile
          label={translate(locale, 'help', 'ShortcutGlobalReturn', customTranslations)}
          shortcut={
            <Kbd>
              CTRL + SHIFT + O
            </Kbd>
          }
        />
        <ShortcutTile
          variant="danger"
          label={translate(locale, 'help', 'ShortcutEmergencyStop', customTranslations)}
          shortcut={
            <Kbd variant="destructive">
              CTRL + SHIFT + X
            </Kbd>
          }
        />
        <ShortcutTile
          label={translate(locale, 'help', 'ShortcutToggleTimer', customTranslations)}
          shortcut={
            <HStack gap="xs">
              <Kbd>
                SPACE
              </Kbd>
              <Kbd>
                CTRL + SPACE
              </Kbd>
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
