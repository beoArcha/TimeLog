import React, { useState } from 'react';
import { Cpu, Terminal, BookOpen } from 'lucide-react';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { toast } from 'sonner';
import CollapsibleCard from '@components/CollapsibleCard';
import { translate } from '@common/i18n/i18n';

export default function ManualTab() {
  const { resolvedTheme, locale, customTranslations } = useOxyFlow();
  const [currentOs, setCurrentOs] = useState<'windows' | 'macos' | 'linux'>('windows');

  const osButtons = (
    <div className="flex gap-2">
      {(['windows', 'macos', 'linux'] as const).map(os => (
        <button
          key={os}
          onClick={() => {
            setCurrentOs(os);
            toast.success(translate(locale, 'manual.osSelected', customTranslations) + ": " + os.toUpperCase());
          }}
          className={`text-xs px-3 py-1 bg-white/5 border border-white/5 rounded-lg capitalize font-mono font-bold hover:text-white cursor-pointer transition-all ${currentOs === os ? 'bg-orange-500/20 border-orange-500/35 text-orange-400' : 'text-slate-400'}`}
        >
          {os}
        </button>
      ))}
    </div>
  );

  return (
    <div className="text-left flex flex-col gap-6 max-h-[85vh] overflow-y-auto pr-1">
      <div className={`border-b pb-3 ${resolvedTheme === 'light' ? 'border-[#DFD7CB]' : 'border-white/5'}`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'}`}>
          <BookOpen className="w-5 h-5 text-rose-500" />
          <span>{translate(locale, 'manual.title', customTranslations)}</span>
        </h2>
        <p className={`text-xs ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{translate(locale, 'manual.description', customTranslations)}</p>
      </div>

      <CollapsibleCard
        title={translate(locale, 'manual.compilationTitle', customTranslations)}
        icon={Cpu}
        iconColor="text-orange-500"
        defaultExpanded={true}
        headerRight={osButtons}
      >
        <ol className={`list-decimal pl-4 flex flex-col gap-4 text-xs ${resolvedTheme === 'light' ? 'text-slate-700' : 'text-slate-300'} font-sans mt-2`}>
          <li>
            {translate(locale, 'manual.step1', customTranslations)} <code className="text-orange-400 font-mono">npm</code>.
          </li>
          <li>
            {translate(locale, 'manual.step2', customTranslations)} (<code className="text-orange-400 font-mono">rustup</code>).
            {currentOs === 'windows' && <span className={`block mt-1 p-2 rounded-lg border font-mono text-[10px] ${resolvedTheme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-black/40 border-white/5 text-zinc-400'}`}>C++ Build Tools for Visual Studio 2022. Komponenty: 'C++ CMake tools for Windows', 'Windows 11 SDK'.</span>}
            {currentOs === 'linux' && <span className={`block mt-1 p-2 rounded-lg border font-mono text-[10px] ${resolvedTheme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-black/40 border-white/5 text-zinc-400'}`}>sudo apt update && sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev</span>}
            {currentOs === 'macos' && <span className={`block mt-1 p-2 rounded-lg border font-mono text-[10px] ${resolvedTheme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-black/40 border-white/5 text-zinc-400'}`}>xcode-select --install (CLang compiler required for macOS bindings)</span>}
          </li>
          <li>
            {translate(locale, 'manual.step3', customTranslations)}
            <pre className={`p-2.5 rounded-lg border font-mono text-[10px] mt-1 select-all ${resolvedTheme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-black/40 border-white/10 text-zinc-400'}`}>npm install</pre>
          </li>
          <li>
            {translate(locale, 'manual.step4', customTranslations)}
            <pre className={`p-2.5 rounded-lg border font-mono text-[10px] text-orange-500 mt-1 select-all font-bold group hover:border-orange-500/30 transition-colors ${resolvedTheme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/10'}`}>npm run tauri build</pre>
          </li>
          <li>
            {translate(locale, 'manual.step5', customTranslations)}
            {currentOs === 'windows' && <code className="ml-1 text-emerald-400 font-mono">src-tauri/target/release/bundle/msi/OxyFlow_x64.msi</code>}
            {currentOs === 'linux' && <code className="ml-1 text-emerald-400 font-mono">src-tauri/target/release/bundle/deb/oxyflow_amd64.deb</code>}
            {currentOs === 'macos' && <code className="ml-1 text-emerald-400 font-mono">src-tauri/target/release/bundle/dmg/OxyFlow.dmg</code>}
          </li>
        </ol>
      </CollapsibleCard>

      <CollapsibleCard
        title={translate(locale, 'manual.shortcutsTitle', customTranslations)}
        icon={Terminal}
        iconColor="text-emerald-500"
        defaultExpanded={false}
      >
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {translate(locale, 'manual.shortcutsDesc', customTranslations)}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className={`p-3 rounded-xl border flex items-center justify-between ${resolvedTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
            <span className={`text-xs font-bold ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}`}>{translate(locale, 'manual.shortcutToggleInterface', customTranslations)}</span>
            <kbd className={`text-[10px] font-mono px-2 py-1 rounded border ${resolvedTheme === 'light' ? 'bg-white text-slate-700 border-slate-300' : 'bg-white/10 text-white border-white/10'}`}>ESC / X</kbd>
          </div>
          <div className={`p-3 rounded-xl border flex items-center justify-between ${resolvedTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
            <span className={`text-xs font-bold ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}`}>{translate(locale, 'manual.shortcutGlobalReturn', customTranslations)}</span>
            <kbd className={`text-[10px] font-mono px-2 py-1 rounded border ${resolvedTheme === 'light' ? 'bg-white text-slate-700 border-slate-300' : 'bg-white/10 text-white border-white/10'}`}>CTRL + SHIFT + O</kbd>
          </div>
          <div className={`p-3 rounded-xl border flex items-center justify-between ${resolvedTheme === 'light' ? 'bg-rose-50 border-rose-200' : 'bg-black/30 border-white/5'}`}>
            <span className={`text-xs font-bold ${resolvedTheme === 'light' ? 'text-rose-700' : 'text-rose-300'}`}>{translate(locale, 'manual.shortcutEmergencyStop', customTranslations)}</span>
            <kbd className={`text-[10px] font-mono px-2 py-1 rounded border ${resolvedTheme === 'light' ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/20'}`}>CTRL + SHIFT + X</kbd>
          </div>
          <div className={`p-3 rounded-xl border flex items-center justify-between ${resolvedTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'}`}>
            <span className={`text-xs font-bold ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'}`}>{translate(locale, 'manual.shortcutToggleTimer', customTranslations)}</span>
            <div className="flex gap-1.5">
              <kbd className={`text-[10px] font-mono px-2 py-1 rounded border ${resolvedTheme === 'light' ? 'bg-white text-slate-700 border-slate-300' : 'bg-white/10 text-white border-white/10'}`}>SPACE</kbd>
              <kbd className={`text-[10px] font-mono px-2 py-1 rounded border ${resolvedTheme === 'light' ? 'bg-white text-slate-700 border-slate-300' : 'bg-white/10 text-white border-white/10'}`}>CTRL + SPACE</kbd>
            </div>
          </div>
          <div className={`p-3 rounded-xl border flex items-center justify-between ${resolvedTheme === 'light' ? 'bg-amber-50 border-amber-200' : 'bg-black/30 border-white/5'}`}>
            <span className={`text-xs font-bold ${resolvedTheme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>{translate(locale, 'manual.shortcutSystemCli', customTranslations)}</span>
            <code className={`text-[10px] font-mono ${resolvedTheme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>./oxytime start --task id</code>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
