import React from 'react';
import { Heart, Code2, Users, FileSignature, Coffee, ShieldCheck, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';

export default function CreditsTab() {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="text-left flex flex-col gap-6 overflow-y-auto pr-1 pb-10">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-black flex items-center gap-3 text-foreground">
          <Heart className="w-6 h-6 text-rose-500 animate-pulse drop-shadow-sm" />
          <span>{translate(locale, 'help', 'CreditsTitle', customTranslations)}</span>
        </h2>
        <p className="text-xs mt-1.5 leading-relaxed max-w-2xl text-muted-foreground">
          {translate(locale, 'help', 'CreditsDesc', customTranslations)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {translate(locale, 'help', 'ZoukTitle', customTranslations)}
            </h3>
          </div>
          <p className="text-[11px] leading-relaxed flex-grow font-medium text-muted-foreground">
            {translate(locale, 'help', 'ZoukBody', customTranslations)}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {translate(locale, 'help', 'OssThanks', customTranslations)}
            </h3>
          </div>
          <p className="text-[11px] leading-relaxed mb-4 flex-grow font-medium text-muted-foreground">
            {translate(locale, 'help', 'OssThanksDesc', customTranslations)}
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {['React', 'Tauri', 'Rust', 'SQLite', 'TailwindCSS'].map(tech => (
              <span key={tech} className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-muted/60 border-border text-foreground">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-500" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {translate(locale, 'help', 'TeamTitle', customTranslations)}
            </h3>
          </div>
          <p className="text-[11px] leading-relaxed font-medium mb-4 whitespace-pre-wrap text-muted-foreground">
            {translate(locale, 'help', 'TeamDesc', customTranslations)}
          </p>
          
          <div className="flex items-center gap-2 mt-auto">
            <Coffee className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-foreground">
              Powered by passion & caffeine
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {translate(locale, 'help', 'LicenseTitle', customTranslations)}
            </h3>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/30 text-muted-foreground font-mono text-[9px] leading-relaxed">
            <div className="mb-2 text-[10px] font-bold text-emerald-500">
              <FileSignature className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              OxyFlow
            </div>
            {translate(locale, 'help', 'LicenseBody', customTranslations)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
