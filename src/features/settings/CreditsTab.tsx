import React from 'react';
import { Heart, Code2, Users, FileSignature, Coffee, ShieldCheck, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';

export default function CreditsTab() {
  const { locale, customTranslations } = useLocale();
  const { resolvedTheme } = useSettings();;

  const isLight = resolvedTheme === 'light';
  const headingColor = isLight ? 'text-slate-900' : 'text-white';
  const mutedColor = isLight ? 'text-slate-600' : 'text-slate-400';
  const cardBg = isLight ? 'bg-slate-50 border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md' : 'bg-black/25 border-white/5 hover:bg-white/5 hover:border-white/10';
  
  return (
    <div className="text-left flex flex-col gap-6 overflow-y-auto pr-1 pb-10">
      <div className={`border-b pb-4 ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
        <h2 className={`text-xl font-black flex items-center gap-3 ${headingColor}`}>
          <Heart className="w-6 h-6 text-rose-500 animate-pulse drop-shadow-sm" />
          <span>{translate(locale, 'help', 'CreditsTitle', customTranslations) || 'Credits, OSS & Creators'}</span>
        </h2>
        <p className={`text-xs mt-1.5 leading-relaxed max-w-2xl ${mutedColor}`}>
          {translate(locale, 'help', 'CreditsDesc', customTranslations)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* The Philosophy of Flow */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col h-full ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className={`text-sm font-bold ${headingColor}`}>
              {translate(locale, 'help', 'ZoukTitle', customTranslations) || 'The Philosophy of Flow'}
            </h3>
          </div>
          <p className={`text-[11px] leading-relaxed flex-grow font-medium ${mutedColor}`}>
            {translate(locale, 'help', 'ZoukBody', customTranslations)}
          </p>
        </motion.div>

        {/* OSS Technologies */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col h-full ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className={`text-sm font-bold ${headingColor}`}>
              {translate(locale, 'help', 'OssThanks', customTranslations) || 'Open Source Technologies'}
            </h3>
          </div>
          <p className={`text-[11px] leading-relaxed mb-4 flex-grow font-medium ${mutedColor}`}>
            {translate(locale, 'help', 'OssThanksDesc', customTranslations)}
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {['React', 'Tauri', 'Rust', 'SQLite', 'TailwindCSS'].map(tech => (
              <span key={tech} className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border
                ${isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-black border-white/10 text-slate-300'}`}>
                {tech}
              </span>
            ))}
          </div>
        </motion.div>

        {/* The Team / Open Source contributors */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col h-full ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-500" />
            </div>
            <h3 className={`text-sm font-bold ${headingColor}`}>
              {translate(locale, 'help', 'TeamTitle', customTranslations) || 'Core Team & Contributors'}
            </h3>
          </div>
          <p className={`text-[11px] leading-relaxed font-medium mb-4 whitespace-pre-wrap ${mutedColor}`}>
            {translate(locale, 'help', 'TeamDesc', customTranslations)}
          </p>
          
          <div className="flex items-center gap-2 mt-auto">
            <Coffee className="w-3.5 h-3.5 text-orange-500" />
            <span className={`text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Powered by passion & caffeine
            </span>
          </div>
        </motion.div>

        {/* License Block */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col h-full ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className={`text-sm font-bold ${headingColor}`}>
              {translate(locale, 'help', 'LicenseTitle', customTranslations) || 'MPL-2.0 License'}
            </h3>
          </div>
          <div className={`p-4 rounded-xl border font-mono text-[9px] leading-relaxed 
            ${isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#0a0a0a] border-white/5 text-slate-400'}`}>
            <div className="mb-2 text-[10px] font-bold text-emerald-500">
              <FileSignature className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              OxyFlow
            </div>
            {translate(locale, 'help', 'LicenseBody', customTranslations) || `Copyright (c) 2026 OxyFlow Team\n\nThis Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.`}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
