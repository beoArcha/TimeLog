import React from 'react';
import { Folder } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { Text, Caption } from '@components/ui/typography';

export default function TaskEmptyState() {
  const { t } = useTranslation('task');

  return (
    <div className="text-center py-16 border border-dashed border-border rounded-[2rem] transition-all duration-300 text-muted-foreground bg-muted/30">
      <Folder className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
      <Text weight="semibold" className="text-foreground">{t('NoTasksInProject')}</Text>
      <Caption variant="muted" className="mt-1">
        {t('CreateMainTaskHint')}
      </Caption>
    </div>
  );
}
