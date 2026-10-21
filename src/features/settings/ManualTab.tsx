import React, { useState } from 'react';
import { Cpu, Terminal, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import CollapsibleCard from '@components/CollapsibleCard';
import CodeBlock from '@components/CodeBlock';
import { Button } from '@components/ui/button';
import { Heading, MonoText, Caption, List, ListItem } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';

export default function ManualTab() {
  const { locale, customTranslations } = useLocale();
  const [currentOs, setCurrentOs] = useState<'windows' | 'macos' | 'linux'>('windows');

  const osButtons = (
    <div className="flex gap-2">
      {(['windows', 'macos', 'linux'] as const).map(os => (
        <Button
          key={os}
          type="button"
          variant={currentOs === os ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setCurrentOs(os);
            toast.success(translate(locale, 'help', 'OsSelected', customTranslations) + ": " + os.toUpperCase());
          }}
          className={`text-xs px-3 py-1 rounded-lg capitalize font-mono font-bold transition-all h-auto ${currentOs === os ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/35 text-orange-400' : 'text-slate-400'}`}
        >
          {os}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="text-left flex flex-col gap-6 max-h-[85vh] overflow-y-auto pr-1">
      <div className="border-b border-border pb-3">
        <Heading level={2} className="text-lg font-bold flex items-center gap-2 text-foreground">
          <BookOpen className="w-5 h-5 text-rose-500" />
          <span>{translate(locale, 'help', 'Title', customTranslations)}</span>
        </Heading>
        <Caption size="xs">{translate(locale, 'help', 'Description', customTranslations)}</Caption>
      </div>

      <CollapsibleCard
        title={translate(locale, 'help', 'CompilationTitle', customTranslations)}
        icon={Cpu}
        iconColor="text-orange-500"
        defaultExpanded={true}
        headerRight={osButtons}
      >
        <List ordered className="pl-4 flex flex-col gap-4 text-xs font-sans mt-2">
          <ListItem>
            {translate(locale, 'help', 'Step1', customTranslations)} <CodeBlock inline className="text-orange-400">npm</CodeBlock>.
          </ListItem>
          <ListItem>
            {translate(locale, 'help', 'Step2', customTranslations)} (<CodeBlock inline className="text-orange-400">rustup</CodeBlock>).
            {currentOs === 'windows' && <MonoText size="2xs" className="block mt-1 p-2 rounded-lg border border-border bg-muted/40 text-muted-foreground">C++ Build Tools for Visual Studio 2022. Komponenty: 'C++ CMake tools for Windows', 'Windows 11 SDK'.</MonoText>}
            {currentOs === 'linux' && <MonoText size="2xs" className="block mt-1 p-2 rounded-lg border border-border bg-muted/40 text-muted-foreground">sudo apt update && sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev</MonoText>}
            {currentOs === 'macos' && <MonoText size="2xs" className="block mt-1 p-2 rounded-lg border border-border bg-muted/40 text-muted-foreground">xcode-select --install (CLang compiler required for macOS bindings)</MonoText>}
          </ListItem>
          <ListItem>
            {translate(locale, 'help', 'Step3', customTranslations)}
            <CodeBlock className="mt-1">npm install</CodeBlock>
          </ListItem>
          <ListItem>
            {translate(locale, 'help', 'Step4', customTranslations)}
            <CodeBlock className="mt-1 text-orange-500 font-bold group hover:border-orange-500/30 transition-colors">npm run tauri build</CodeBlock>
          </ListItem>
          <ListItem>
            {translate(locale, 'help', 'Step5', customTranslations)}
            {currentOs === 'windows' && <CodeBlock inline className="ml-1 text-emerald-400">src-tauri/target/release/bundle/msi/OxyFlow_x64.msi</CodeBlock>}
            {currentOs === 'linux' && <CodeBlock inline className="ml-1 text-emerald-400">src-tauri/target/release/bundle/deb/oxyflow_amd64.deb</CodeBlock>}
            {currentOs === 'macos' && <CodeBlock inline className="ml-1 text-emerald-400">src-tauri/target/release/bundle/dmg/OxyFlow.dmg</CodeBlock>}
          </ListItem>
        </List>
      </CollapsibleCard>

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
          <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
            <span className="text-xs font-bold text-card-foreground">{translate(locale, 'help', 'ShortcutToggleInterface', customTranslations)}</span>
            <kbd className="text-xs font-mono px-2 py-1 rounded border border-border bg-muted text-foreground">ESC / X</kbd>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
            <span className="text-xs font-bold text-card-foreground">{translate(locale, 'help', 'ShortcutGlobalReturn', customTranslations)}</span>
            <kbd className="text-xs font-mono px-2 py-1 rounded border border-border bg-muted text-foreground">CTRL + SHIFT + O</kbd>
          </div>
          <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500">{translate(locale, 'help', 'ShortcutEmergencyStop', customTranslations)}</span>
            <kbd className="text-xs font-mono px-2 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400">CTRL + SHIFT + X</kbd>
          </div>
          <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
            <span className="text-xs font-bold text-card-foreground">{translate(locale, 'help', 'ShortcutToggleTimer', customTranslations)}</span>
            <div className="flex gap-1.5">
              <kbd className="text-xs font-mono px-2 py-1 rounded border border-border bg-muted text-foreground">SPACE</kbd>
              <kbd className="text-xs font-mono px-2 py-1 rounded border border-border bg-muted text-foreground">CTRL + SPACE</kbd>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500">{translate(locale, 'help', 'ShortcutSystemCli', customTranslations)}</span>
            <MonoText size="2xs" className="text-amber-500">./oxytime start --task id</MonoText>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
