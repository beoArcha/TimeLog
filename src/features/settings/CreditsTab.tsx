import React from 'react';
import { Heart, Code2, Users, FileSignature, Coffee, ShieldCheck, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { Heading, Caption, Text } from '@components/ui/typography';
import { Badge } from '@components/ui/badge';
import { HStack, InlineCluster } from '@components/ui/stack';

export default function CreditsTab() {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="text-left flex flex-col gap-6 overflow-y-auto pr-1 pb-10">
      <div className="border-b border-border pb-4">
        <HStack gap="md">
          <Heart className="w-6 h-6 text-rose-500 animate-pulse drop-shadow-sm" />
          <Heading level={2} className="text-xl font-black text-foreground">
            {translate(locale, 'help', 'CreditsTitle', customTranslations)}
          </Heading>
        </HStack>
        <Text variant="muted" className="mt-1.5 leading-relaxed max-w-2xl">
          {translate(locale, 'help', 'CreditsDesc', customTranslations)}
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full"
        >
          <HStack gap="sm" className="mb-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
            </div>
            <Heading level={3} className="text-sm font-bold text-foreground">
              {translate(locale, 'help', 'ZoukTitle', customTranslations)}
            </Heading>
          </HStack>
          <Caption size="xs" className="leading-relaxed flex-grow font-medium text-muted-foreground block">
            {translate(locale, 'help', 'ZoukBody', customTranslations)}
          </Caption>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full"
        >
          <HStack gap="sm" className="mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-indigo-500" />
            </div>
            <Heading level={3} className="text-sm font-bold text-foreground">
              {translate(locale, 'help', 'OssThanks', customTranslations)}
            </Heading>
          </HStack>
          <Caption size="xs" className="leading-relaxed mb-4 flex-grow font-medium text-muted-foreground block">
            {translate(locale, 'help', 'OssThanksDesc', customTranslations)}
          </Caption>
          <InlineCluster gap="sm" className="mt-auto">
            {['React', 'Tauri', 'Rust', 'SQLite', 'TailwindCSS', 'Bun'].map(tech => (
              <Badge key={tech} size="xs" variant="outline" className="font-bold tracking-wider uppercase">
                {tech}
              </Badge>
            ))}
          </InlineCluster>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full"
        >
          <HStack gap="sm" className="mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-500" />
            </div>
            <Heading level={3} className="text-sm font-bold text-foreground">
              {translate(locale, 'help', 'TeamTitle', customTranslations)}
            </Heading>
          </HStack>
          <Caption size="xs" className="leading-relaxed font-medium mb-4 whitespace-pre-wrap text-muted-foreground block">
            {translate(locale, 'help', 'TeamDesc', customTranslations)}
          </Caption>
          
          <HStack gap="sm" className="mt-auto">
            <Coffee className="w-3.5 h-3.5 text-orange-500" />
            <Caption size="2xs" className="font-bold text-foreground">
              {translate(locale, 'help', 'PoweredByPassionCaffeine', customTranslations)}
            </Caption>
          </HStack>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-5 rounded-3xl border border-border bg-card shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-300 flex flex-col h-full"
        >
          <HStack gap="sm" className="mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <Heading level={3} className="text-sm font-bold text-foreground">
              {translate(locale, 'help', 'LicenseTitle', customTranslations)}
            </Heading>
          </HStack>
          <div className="p-4 rounded-xl border border-border bg-muted/30 text-muted-foreground font-mono text-xs leading-relaxed">
            <div className="mb-2 text-xs font-bold text-emerald-500">
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
