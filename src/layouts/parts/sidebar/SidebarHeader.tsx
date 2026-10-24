import { Folder } from 'lucide-react';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import { Heading } from '@components/ui/typography';
import { Badge } from '@components/ui/badge';
import { HStack } from '@components/ui/stack';

export interface SidebarHeaderProps {
  count: number;
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function SidebarHeader({ count, locale, customTranslations }: SidebarHeaderProps) {
  return (
    <HStack justify="between" className="mb-4 border-b border-border pb-3">
      <Heading level={3} className="text-title flex items-center gap-2">
        <Folder className="icon-medium text-orange-400" />
        {translate(locale, 'project', 'ProjectsLabel', customTranslations)} ({count})
      </Heading>
      <Badge
        variant="orange"
        size="sm"
        as="span"
        className="text-orange-600 dark:text-orange-300 uppercase tracking-wider font-mono font-bold"
      >
        MicroORM Tables
      </Badge>
    </HStack>
  );
}
