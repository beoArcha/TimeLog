import React from 'react';
import { Shield, Moon, Sun, Eye, Laptop, Languages } from 'lucide-react';
import { useOxyFlow } from '../../hooks/useOxyFlow';
import { translate } from '../../utils/i18n';
import versionsData from '../../versions.json';
import { GuiVariant } from '../../bindings/GuiVariant';

export default function Header() {
  const {
    guiVariant,
    setGuiVariant,
    uiScale,
    setUiScale,
    theme,
    setTheme,
    resolvedTheme,
    localePref,
    setLocalePref,
    locale,
    customTranslations,
    engineState,
    showToast
  } = useOxyFlow();

  return (
    <div 
      className={`px-4 py-2 flex items-center justify-between border-b transition-all duration-300 select-none ${
        resolvedTheme === 'light'
          ? 'bg-[#EDE7DE] border-[#DFD7CB] text-[#2C2421]'
          : resolvedTheme === 'high-contrast'
          ? 'bg-black border-white border-b-2 text-white'
          : 'bg-black/40 border-white/10 text-slate-300'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 ${
          resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-slate-300'
        }`}>
          <Shield className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          LOGTIME BY OXYFLOW v{versionsData.major}.{versionsData.minor}.{versionsData.release}
        </span>
        
        {/* Size Switcher */}
        <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
          resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
        }`}>
          {(['small', 'medium', 'large'] as const).map(sz => {
            const isActive = guiVariant === sz;
            return (
              <button
                key={sz}
                onClick={() => {
                  setGuiVariant(sz);
                  if (showToast) {
                    showToast(`${translate(locale, 'app.sizeChanged', customTranslations)} ${sz.toUpperCase()}`);
                  }
                }}
                className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  isActive
                    ? resolvedTheme === 'light'
                      ? 'bg-[#FCFAF8] text-[#2C2421] border border-[#DFD7CB] shadow-sm font-bold'
                      : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-bold'
                    : resolvedTheme === 'light'
                    ? 'text-[#8A7A71] hover:text-[#2C2421]'
                    : 'text-[#9B8C83] hover:text-white'
                }`}
              >
                {sz === 'small' ? 'Małe' : sz === 'medium' ? 'Średnie' : 'Duże'}
              </button>
            );
          })}
        </div>

        {/* UI Scale Switcher (A A A) */}
        <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
          resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
        }`}>
          {(['FHD', 'QHD', 'UHD'] as const).map(scale => {
            const isActive = uiScale === scale;
            const textSize = scale === 'FHD' ? 'text-[9px]' : scale === 'QHD' ? 'text-[11px]' : 'text-[13px]';
            return (
              <button
                key={scale}
                onClick={() => setUiScale(scale)}
                className={`px-2.5 py-0.5 rounded-md uppercase transition-all cursor-pointer flex flex-col items-center justify-center min-w-[32px] ${
                  isActive
                    ? resolvedTheme === 'light'
                      ? 'bg-[#FCFAF8] text-indigo-600 border border-[#DFD7CB] shadow-sm font-bold'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                    : resolvedTheme === 'light'
                    ? 'text-[#8A7A71] hover:text-[#2C2421]'
                    : 'text-[#9B8C83] hover:text-white'
                }`}
              >
                <span className={`font-serif leading-none font-bold ${textSize}`}>A</span>
              </button>
            );
          })}
        </div>

        {/* Theme Switcher */}
        <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
          resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
        }`}>
          {[
            { id: 'dark', icon: Moon, label: 'CIEMNY' },
            { id: 'light', icon: Sun, label: 'JASNY' },
            { id: 'high-contrast', icon: Eye, label: 'MOCNY' },
            { id: 'system', icon: Laptop, label: 'SYS' }
          ].map(th => {
            const isActive = theme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => setTheme(th.id as any)}
                className={`px-2.5 py-0.5 flex items-center gap-1.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  isActive
                    ? resolvedTheme === 'light'
                      ? 'bg-[#FCFAF8] text-orange-600 border border-[#DFD7CB] shadow-sm font-bold'
                      : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-bold'
                    : resolvedTheme === 'light'
                    ? 'text-[#8A7A71] hover:text-[#2C2421]'
                    : 'text-[#9B8C83] hover:text-white'
                }`}
              >
                <th.icon className="w-3 h-3" />
                <span className="hidden xl:inline">{th.label}</span>
              </button>
            );
          })}
        </div>

        {/* Language Switcher */}
        <div className={`flex items-center p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
          resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
        }`}>
          <Languages className={`w-3.5 h-3.5 mx-2 ${resolvedTheme === 'light' ? 'text-blue-500' : 'text-blue-400'}`} />
          {(['pl', 'en', 'de', 'es', 'pt-br', 'fr', 'system'] as const).map(l => {
            const isActive = localePref === l;
            return (
              <button
                key={l}
                onClick={() => setLocalePref(l)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  isActive
                    ? resolvedTheme === 'light'
                      ? 'bg-blue-500 text-white border border-blue-600 shadow-sm font-bold'
                      : 'bg-blue-500 text-white border border-blue-600 font-bold'
                    : resolvedTheme === 'light'
                    ? 'text-[#8A7A71] hover:text-[#2C2421]'
                    : 'text-[#9B8C83] hover:text-white'
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold hidden sm:inline ${
          engineState === 'searching' 
            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-350 animate-pulse border border-amber-500/20' 
            : resolvedTheme === 'light'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
        }`}>
          {engineState === 'searching' ? 'CONNECTING' : 'DAEMON RUNNING'}
        </span>
      </div>
    </div>
  );
}
