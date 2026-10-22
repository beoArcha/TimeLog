import React from 'react';
import { Clock, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { Project } from '@bindings/Project';
import { Locale } from '@bindings/Locale';
import { PROJECT_COLORS } from '@common/constants/projectColors';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { Text, Caption } from '@components/ui/typography';
import { HStack, VStack, InlineCluster } from '@components/ui/stack';

const HOVER_REVEAL_CLASS = 'opacity-0 group-hover:opacity-100 transition duration-200';
const REORDER_BTN_CLASS = 'h-4 w-4 p-0 text-muted-foreground hover:text-orange-500 disabled:opacity-20 cursor-pointer';

export interface SidebarProjectItemProps {
  key?: React.Key;
  project: Project;
  isSelected: boolean;
  totalSeconds: number;
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  isFirst: boolean;
  isLast: boolean;
  isEditingInline: boolean;
  inlineEditName: string;
  onSelect: (id: string) => void;
  onEditDialog: (project: Project) => void;
  onToggleArchive?: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onInlineNameChange: (val: string) => void;
  onCommitInlineRename: (id: string, name: string) => void;
  onCancelInlineRename: () => void;
}

export function SidebarProjectItem({
  project,
  isSelected,
  totalSeconds,
  locale,
  customTranslations,
  isFirst,
  isLast,
  isEditingInline,
  inlineEditName,
  onSelect,
  onEditDialog,
  onToggleArchive,
  onMoveUp,
  onMoveDown,
  onInlineNameChange,
  onCommitInlineRename,
  onCancelInlineRename,
}: SidebarProjectItemProps) {
  const projColor = PROJECT_COLORS.find(c => c.name === project.color) || PROJECT_COLORS[0];

  const handleInlineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onCommitInlineRename(project.id, inlineEditName);
    } else if (e.key === 'Escape') {
      onCancelInlineRename();
    }
  };

  return (
    <div
      id={`project-item-${project.id}`}
      data-archived={project.archived ? 'true' : 'false'}
      onClick={() => onSelect(project.id)}
      className={`text-left w-full padding-section rounded-section flex items-center justify-between transition-all duration-300 relative overflow-hidden cursor-pointer group ${
        isSelected
          ? 'bg-primary/10 border-l-4 border-l-primary border border-border shadow-xs'
          : 'bg-transparent border border-transparent hover:bg-muted text-foreground'
      } ${project.archived ? 'opacity-50 grayscale' : ''}`}
    >
      <HStack gap="sm" align="start" className="z-10 animate-fade-in min-w-0 flex-1 mr-2 gap-2.5">
        {project.icon ? (
          <span className="icon-medium flex items-center justify-center text-lg shrink-0">
            {project.icon}
          </span>
        ) : (
          <span className={`icon-small rounded-full ${projColor.bg} shadow-md shadow-black/20 shrink-0 mt-1`} />
        )}

        <VStack gap="none" className="min-w-0 flex-1">
          {isEditingInline ? (
            <Input
              type="text"
              value={inlineEditName}
              autoFocus
              onClick={e => e.stopPropagation()}
              onChange={e => onInlineNameChange(e.target.value)}
              onBlur={() => onCommitInlineRename(project.id, inlineEditName)}
              onKeyDown={handleInlineKeyDown}
              className="font-semibold text-main rounded px-1 outline-none h-7 bg-background text-foreground border border-input"
            />
          ) : (
            <Text weight="semibold" className="text-main truncate text-foreground">
              {project.archived && (
                <Badge variant="destructive" size="xs" as="span" className="mr-1 uppercase leading-none">
                  {translate(locale, 'common', 'ArchiveNoun', customTranslations)}
                </Badge>
              )}
              {project.name}
            </Text>
          )}

          {project.description && (
            <Caption className="mt-0.5 truncate">
              {project.description}
            </Caption>
          )}

          {project.tags && project.tags.length > 0 && (
            <InlineCluster gap="xs" className="mt-1">
              {project.tags.map(t => (
                <Badge key={t} variant="orange" size="xs" as="span" className="font-sans leading-none">
                  {t}
                </Badge>
              ))}
            </InlineCluster>
          )}

          <Caption variant="muted" className="text-main opacity-80 font-sans tracking-wide flex items-center gap-2 mt-0.5">
            {translate(locale, 'common', 'CreatedAtLabel', customTranslations)} {new Date(project.createdAt).toLocaleDateString()}

            {!isEditingInline && (
              <Button
                id={`edit-project-btn-${project.id}`}
                type="button"
                variant="ghost"
                size="icon-xs"
                title={translate(locale, 'common', 'EditName', customTranslations)}
                onClick={e => {
                  e.stopPropagation();
                  onEditDialog(project);
                }}
                className={`${HOVER_REVEAL_CLASS} text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}

            <Button
              id={`archive-project-btn-${project.id}`}
              type="button"
              variant="outline"
              size="xs"
              onClick={e => {
                e.stopPropagation();
                onToggleArchive?.(project.id);
              }}
              className={`${HOVER_REVEAL_CLASS} px-1.5 py-0.5 h-auto rounded uppercase font-bold tracking-wider hover:bg-destructive hover:text-destructive-foreground`}
            >
              {project.archived
                ? translate(locale, 'common', 'Unarchive', customTranslations)
                : translate(locale, 'common', 'Archive', customTranslations)}
            </Button>
          </Caption>
        </VStack>
      </HStack>

      <HStack gap="sm" className="z-10 shrink-0">
        <VStack gap="none" className={HOVER_REVEAL_CLASS}>
          <Button
            id={`move-up-project-btn-${project.id}`}
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isFirst}
            aria-label={translate(locale, 'project', 'MoveProjectUp', customTranslations)}
            title={translate(locale, 'project', 'MoveProjectUp', customTranslations)}
            onClick={e => {
              e.stopPropagation();
              onMoveUp(project.id);
            }}
            className={REORDER_BTN_CLASS}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
          <Button
            id={`move-down-project-btn-${project.id}`}
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isLast}
            aria-label={translate(locale, 'project', 'MoveProjectDown', customTranslations)}
            title={translate(locale, 'project', 'MoveProjectDown', customTranslations)}
            onClick={e => {
              e.stopPropagation();
              onMoveDown(project.id);
            }}
            className={REORDER_BTN_CLASS}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
        </VStack>

        <HStack gap="xs" className="font-mono text-main font-bold px-2.5 py-1 rounded-full border border-border bg-card text-foreground transition-all shrink-0">
          <Clock className="icon-medium text-orange-500" />
          {formatSeconds(totalSeconds)}
        </HStack>
      </HStack>
    </div>
  );
}
