import { Folder } from 'lucide-react';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import { Heading } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { Button } from '@components/ui/button';

export interface SidebarHeaderProps {
  count: number;
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  isReportsActive?: boolean;
  isAllSelected?: boolean;
  onResetScope?: () => void;
}

export function SidebarHeader({
  count,
  locale,
  customTranslations,
  isReportsActive,
  isAllSelected,
  onResetScope,
}: SidebarHeaderProps) {
  return (
    <HStack justify="between" align="center" className="mb-4 border-b border-border pb-3">
      <Heading level={3} className="text-title flex items-center gap-2">
        <Folder className="icon-medium text-orange-400" />
        {translate(locale, 'project', 'ProjectsLabel', customTranslations)} ({count})
      </Heading>
      {isReportsActive && onResetScope && (
        <Button
          type="button"
          size="xs"
          variant={isAllSelected ? 'accent' : 'outline'}
          aria-pressed={isAllSelected}
          onClick={onResetScope}
          data-testid="sidebar-reset-scope"
          title={translate(locale, 'report', 'ResetProjectScope', customTranslations)}
          aria-label={translate(locale, 'report', 'ResetProjectScope', customTranslations)}
          className="text-xs font-mono"
        >
          {translate(locale, 'common', 'All', customTranslations)}
        </Button>
      )}
    </HStack>
  );
}
