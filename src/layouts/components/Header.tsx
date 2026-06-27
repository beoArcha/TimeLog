import React from 'react';
import { Shield, Moon, Sun, Eye, Laptop, Languages } from 'lucide-react';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { translate } from '@common/i18n/i18n';
import versionsData from '../../versions.json';
import { AppKey } from '@common/i18n/keys/AppKey';

export default function Header() {
  const {
    guiSize,
    setGuiSize,
    textAndIconSize,
    setTextAndIconSize,
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
      className={`border-b transition-all duration-300 ${resolvedTheme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB]' : 'bg-slate-900/60 backdrop-blur-2xl border-white/5'
        } py-3.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-400 to-rose-500 shadow-lg flex items-center justify-center text-white transform hover:rotate-3 transition-transform">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className={`font-sans font-bold text-base tracking-tight leading-none ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'
            }`}>
            OxyFlow Client
            <span className="text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded ml-2 font-bold font-mono">
              <v>{versionsData.subversions.front}</v>
            </span>
          </h1>
          <p className={`text-[10px] font-sans mt-0.5 ${resolvedTheme === 'light' ? 'text-[#8A7A71]' : 'text-[#9B8C83]'
            }`}>
            {translate(locale, AppKey.Subtitle, customTranslations)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
          }`}>
          {(['small', 'medium', 'large'] as const).map(sz => {
            const isActive = guiSize === sz;
            return (
              <button
                key={sz}
                onClick={() => {
                  setGuiSize(sz);
                  if (showToast) {
                    const label = sz === 'small' ? translate(locale, AppKey.SizeSmall, customTranslations) : sz === 'medium' ? translate(locale, AppKey.SizeMedium, customTranslations) : translate(locale, AppKey.SizeLarge, customTranslations);
                    showToast(`${translate(locale, AppKey.SizeChanged, customTranslations)} ${label}`);
                  }
                }}
                className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${isActive
                  ? resolvedTheme === 'light'
                    ? 'bg-[#FCFAF8] text-[#2C2421] border border-[#DFD7CB] shadow-sm font-bold'
                    : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-bold'
                  : resolvedTheme === 'light'
                    ? 'text-[#8A7A71] hover:text-[#2C2421]'
                    : 'text-[#9B8C83] hover:text-white'
                  }`}
              >
                {sz === 'small' ? translate(locale, AppKey.SizeSmall, customTranslations) : sz === 'medium' ? translate(locale, AppKey.SizeMedium, customTranslations) : translate(locale, AppKey.SizeLarge, customTranslations)}
              </button>
            );
          })}
        </div>

        <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
          }`}>
          {(['small', 'medium', 'large'] as const).map(scale => {
            const isActive = textAndIconSize === scale;
            const textSize = scale === 'small' ? 'text-[9px]' : scale === 'medium' ? 'text-[11px]' : 'text-[13px]';
            return (
              <button
                key={scale}
                onClick={() => setTextAndIconSize(scale)}
                className={`px-2.5 py-0.5 rounded-md uppercase transition-all cursor-pointer flex flex-col items-center justify-center min-w-[32px] ${isActive
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

        <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
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
                className={`px-2.5 py-0.5 flex items-center gap-1.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${isActive
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

        <div className={`flex items-center p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
          }`}>
          <Languages className={`w-3.5 h-3.5 mx-2 ${resolvedTheme === 'light' ? 'text-blue-500' : 'text-blue-400'}`} />
          {(['pl', 'en', 'de', 'es', 'pt-br', 'fr', 'system'] as const).map(l => {
            const isActive = localePref === l;
            return (
              <button
                key={l}
                onClick={() => setLocalePref(l)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${isActive
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
        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold hidden sm:inline ${engineState === 'searching'
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
