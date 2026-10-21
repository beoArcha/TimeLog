import React from 'react';
import { Cpu } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import CodeBlock from '@components/CodeBlock';
import { MonoText, List, ListItem } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { OsSelector, type SupportedOs } from './OsSelector';

export interface CompilationGuideCardProps {
  currentOs: SupportedOs;
  onSelectOs: (os: SupportedOs) => void;
}

export function CompilationGuideCard({
  currentOs,
  onSelectOs,
}: CompilationGuideCardProps) {
  const { locale, customTranslations } = useLocale();
  return (
    <CollapsibleCard
      title={translate(locale, 'help', 'CompilationTitle', customTranslations)}
      icon={Cpu}
      iconColor="text-orange-500"
      defaultExpanded={true}
      headerRight={<OsSelector currentOs={currentOs} onSelectOs={onSelectOs} />}
    >
      <List ordered className="pl-4 flex flex-col gap-4 text-xs font-sans mt-2">
        <ListItem>
          {translate(locale, 'help', 'Step1', customTranslations)} <CodeBlock inline className="text-orange-400">bun</CodeBlock>.
        </ListItem>
        <ListItem>
          {translate(locale, 'help', 'Step2', customTranslations)} (<CodeBlock inline className="text-orange-400">rustup</CodeBlock>).
          {currentOs === 'windows' && (
            <MonoText size="2xs" className="block mt-1 p-2 rounded-lg border border-border bg-muted/40 text-muted-foreground">
              {translate(locale, 'help', 'Step2WinBuildTools', customTranslations)}
            </MonoText>
          )}
          {currentOs === 'linux' && (
            <MonoText size="2xs" className="block mt-1 p-2 rounded-lg border border-border bg-muted/40 text-muted-foreground">
              sudo apt update && sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
            </MonoText>
          )}
          {currentOs === 'macos' && (
            <MonoText size="2xs" className="block mt-1 p-2 rounded-lg border border-border bg-muted/40 text-muted-foreground">
              xcode-select --install (CLang compiler required for macOS bindings)
            </MonoText>
          )}
        </ListItem>
        <ListItem>
          {translate(locale, 'help', 'Step3', customTranslations)}
          <CodeBlock className="mt-1">bun install</CodeBlock>
        </ListItem>
        <ListItem>
          {translate(locale, 'help', 'Step4', customTranslations)}
          <CodeBlock className="mt-1 text-orange-500 font-bold group hover:border-orange-500/30 transition-colors">bun run tauri:dev</CodeBlock>
        </ListItem>
        <ListItem>
          {translate(locale, 'help', 'Step5', customTranslations)}
          {currentOs === 'windows' && <CodeBlock inline className="ml-1 text-emerald-400">src-tauri/target/release/bundle/msi/OxyFlow_x64.msi</CodeBlock>}
          {currentOs === 'linux' && <CodeBlock inline className="ml-1 text-emerald-400">src-tauri/target/release/bundle/deb/oxyflow_amd64.deb</CodeBlock>}
          {currentOs === 'macos' && <CodeBlock inline className="ml-1 text-emerald-400">src-tauri/target/release/bundle/dmg/OxyFlow.dmg</CodeBlock>}
        </ListItem>
      </List>
    </CollapsibleCard>
  );
}

export default CompilationGuideCard;
