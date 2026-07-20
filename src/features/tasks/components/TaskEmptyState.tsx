import React from 'react';
import { Folder } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';

interface TaskEmptyStateProps {
  theme: string;
}

export default function TaskEmptyState({
  theme,
}: TaskEmptyStateProps) {
  const { t } = useTranslation('task');

  return (
    <div className={`text-center py-16 border border-dashed rounded-[2rem] transition-all duration-300 ${theme === 'light'
      ? 'border-[#DFD7CB] text-[#8A7A71] bg-[#F4EFEA]/50'
      : 'border-white/10 text-[#9B8C83]'
      }`}>
      <Folder className="w-8 h-8 mx-auto text-[#9B8C83] mb-2" />
      <p className="text-sm font-semibold">{t('NoTasksInProject')}</p>
      <p className="text-xs text-[#8A7A71] mt-1">
        {t('CreateMainTaskHint')}
      </p>
    </div>
  );
}
