import React from 'react';
import { Heart, Code2, Users, FileSignature, Coffee, ShieldCheck, HeartHandshake } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { Heading, Caption, Text, MonoText } from '@components/ui/typography';
import { Badge } from '@components/ui/badge';
import { HStack, VStack, InlineCluster } from '@components/ui/stack';
import { CreditCard } from './components/CreditCard';

const OPEN_SOURCE_STACK = ['React', 'Tauri', 'Rust', 'SQLite', 'TailwindCSS', 'Bun'] as const;

export default function CreditsTab() {
  const { locale, customTranslations } = useLocale();

  return (
    <VStack gap="lg" className="text-left pb-10">
      <VStack as="header" gap="xs" className="border-b border-border pb-4">
        <HStack gap="md">
          <Heart className="w-6 h-6 text-rose-500 animate-pulse drop-shadow-sm" />
          <Heading level={2} className="text-xl font-black text-foreground">
            {translate(locale, 'help', 'CreditsTitle', customTranslations)}
          </Heading>
        </HStack>
        <Text variant="muted" className="mt-1.5 leading-relaxed max-w-2xl">
          {translate(locale, 'help', 'CreditsDesc', customTranslations)}
        </Text>
      </VStack>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CreditCard
          title={translate(locale, 'help', 'ZoukTitle', customTranslations)}
          icon={HeartHandshake}
          iconBgClass="bg-rose-500/10"
          iconColorClass="text-rose-500"
          delay={0.05}
        >
          <Caption size="xs" className="leading-relaxed flex-grow font-medium text-muted-foreground block">
            {translate(locale, 'help', 'ZoukBody', customTranslations)}
          </Caption>
        </CreditCard>

        <CreditCard
          title={translate(locale, 'help', 'OssThanks', customTranslations)}
          icon={Code2}
          iconBgClass="bg-indigo-500/10"
          iconColorClass="text-indigo-500"
          delay={0.1}
          footer={
            <InlineCluster gap="sm">
              {OPEN_SOURCE_STACK.map(tech => (
                <Badge key={tech} size="xs" variant="outline" className="font-bold tracking-wider uppercase">
                  {tech}
                </Badge>
              ))}
            </InlineCluster>
          }
        >
          <Caption size="xs" className="leading-relaxed mb-4 flex-grow font-medium text-muted-foreground block">
            {translate(locale, 'help', 'OssThanksDesc', customTranslations)}
          </Caption>
        </CreditCard>

        <CreditCard
          title={translate(locale, 'help', 'TeamTitle', customTranslations)}
          icon={Users}
          iconBgClass="bg-teal-500/10"
          iconColorClass="text-teal-500"
          delay={0.15}
          footer={
            <HStack gap="sm">
              <Coffee className="w-3.5 h-3.5 text-orange-500" />
              <Caption size="2xs" className="font-bold text-foreground">
                {translate(locale, 'help', 'PoweredByPassionCaffeine', customTranslations)}
              </Caption>
            </HStack>
          }
        >
          <VStack gap="sm" className="mb-4">
            {translate(locale, 'help', 'TeamDesc', customTranslations)
              .split(/\r?\n\r?\n|\\n\\n/)
              .map(p => p.trim())
              .filter(Boolean)
              .map((paragraph, idx) => (
                <Caption key={idx} size="xs" className="leading-relaxed font-medium text-muted-foreground block">
                  {paragraph}
                </Caption>
              ))}
          </VStack>
        </CreditCard>

        <CreditCard
          title={translate(locale, 'help', 'LicenseTitle', customTranslations)}
          icon={ShieldCheck}
          iconBgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-500"
          delay={0.2}
        >
          <VStack gap="xs" className="p-4 rounded-xl border border-border bg-muted/30 text-muted-foreground leading-relaxed">
            <Text size="xs" weight="bold" className="mb-2 text-emerald-500 flex items-center gap-1">
              <FileSignature className="w-3 h-3 shrink-0" />
              OxyFlow
            </Text>
            <VStack gap="xs">
              {translate(locale, 'help', 'LicenseBody', customTranslations)
                .split(/\r?\n\r?\n|\\n\\n/)
                .map(p => p.trim())
                .filter(Boolean)
                .map((paragraph, idx) => (
                  <MonoText key={idx} size="xs" className="block">
                    {paragraph}
                  </MonoText>
                ))}
            </VStack>
          </VStack>
        </CreditCard>
      </div>
    </VStack>
  );
}
