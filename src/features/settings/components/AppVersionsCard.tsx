import React from 'react';
import { Info } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { Caption, MonoText, Text } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import metadata from '@/metadata.json';

interface VersionTileProps {
  label: string;
  version: string;
}

function VersionTile({ label, version }: VersionTileProps) {
  return (
    <div className="p-3 rounded-xl border border-border bg-muted/30 flex flex-col items-center">
      <Caption size="2xs" variant="muted" className="mb-1">
        {label}
      </Caption>
      <MonoText size="xs" weight="bold">
        v{version}
      </MonoText>
    </div>
  );
}

export function AppVersionsCard() {
  const { locale, customTranslations } = useLocale();

  return (
    <CollapsibleCard
      title={translate(locale, 'settings', 'VersionsTitle', customTranslations)}
      icon={Info}
      iconColor="text-blue-500"
      titleColor="text-blue-500"
      defaultExpanded={false}
      wrapperClassName="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 mt-2 text-sm">
        <HStack justify="between" className="pb-2 border-b border-border">
          <Text size="sm" weight="medium">
            {translate(locale, 'settings', 'AppRelease', customTranslations)}
          </Text>
          <MonoText size="sm" weight="bold" className="text-blue-500">
            v{metadata.version}
          </MonoText>
        </HStack>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs mt-2">
          <VersionTile
            label={translate(locale, 'settings', 'EngineComponent', customTranslations)}
            version={`${metadata.versions.major}.${metadata.versions.minor}.${metadata.versions.subversions.engine}`}
          />
          <VersionTile
            label={translate(locale, 'settings', 'FrontComponent', customTranslations)}
            version={`${metadata.versions.major}.${metadata.versions.minor}.${metadata.versions.subversions.front}`}
          />
          <VersionTile
            label={translate(locale, 'settings', 'ComponentsLibrary', customTranslations)}
            version={`${metadata.versions.major}.${metadata.versions.minor}.${metadata.versions.subversions.components}`}
          />
          <VersionTile
            label={translate(locale, 'settings', 'TranslationsPack', customTranslations)}
            version={`${metadata.versions.major}.${metadata.versions.minor}.${metadata.versions.subversions.translations}`}
          />
        </div>
      </div>
    </CollapsibleCard>
  );
}

export default AppVersionsCard;
