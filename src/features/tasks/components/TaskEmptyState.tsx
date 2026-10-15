import React from 'react';
import { Folder } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';

interface TaskEmptyStateProps {
  theme?: string;
}

export default function TaskEmptyState(_props: TaskEmptyStateProps = {}) {
  const { t } = useTranslation('task');

  return (
    <div className="text-center py-16 border border-dashed border-border rounded-[2rem] transition-all duration-300 text-muted-foreground bg-muted/30">
      <Folder className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm font-semibold text-foreground">{t('NoTasksInProject')}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {t('CreateMainTaskHint')}
      </p>
    </div>
  );
}
