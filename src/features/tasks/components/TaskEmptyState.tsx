import React from 'react';
import { Folder } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { EmptyState } from '@components/EmptyState';

export default function TaskEmptyState() {
  const { t } = useTranslation('task');

  return (
    <EmptyState
      icon={Folder}
      title={t('NoTasksInProject')}
      description={t('CreateMainTaskHint')}
      className="border-border text-muted-foreground bg-muted/30 py-16 rounded-[2rem]"
    />
  );
}
