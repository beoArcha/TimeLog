import React from 'react';
import { Plus } from 'lucide-react';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import { PROJECT_COLORS } from '@common/constants/projectColors';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { VStack, HStack, InlineCluster } from '@components/ui/stack';

export interface SidebarProjectFormProps {
  onAddProject: (
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ) => void;
  isLoading?: boolean;
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  initialName?: string;
  initialColor?: string;
  onNameChange?: (name: string) => void;
  onColorChange?: (color: string) => void;
}

export function SidebarProjectForm({
  onAddProject,
  isLoading,
  locale,
  customTranslations,
  initialName = '',
  initialColor = 'violet',
  onNameChange,
  onColorChange,
}: SidebarProjectFormProps) {
  const [name, setNameLocal] = React.useState(initialName);
  const [color, setColorLocal] = React.useState(initialColor);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [icon, setIcon] = React.useState('');
  const [tags, setTags] = React.useState('');

  const handleNameChange = (val: string) => {
    setNameLocal(val);
    onNameChange?.(val);
  };

  const handleColorChange = (val: string) => {
    setColorLocal(val);
    onColorChange?.(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    onAddProject(
      trimmedName,
      color,
      description.trim() || null,
      icon.trim() || null,
      tagsArr.length > 0 ? tagsArr : null
    );

    handleNameChange('');
    setDescription('');
    setIcon('');
    setTags('');
    setShowAdvanced(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 padding-section rounded-section border border-border bg-muted/40 transition-all">
      <VStack gap="sm" className="gap-section">
        <Input
          id="new-project-input"
          type="text"
          placeholder={translate(locale, 'project', 'EnterProjectName', customTranslations)}
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          className="w-full border border-input bg-card text-foreground placeholder:text-muted-foreground px-3 input-py rounded-section text-main focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all"
        />

        <HStack justify="between" className="mt-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="font-mono text-muted-foreground hover:text-orange-500 transition-colors uppercase tracking-wider h-auto p-0"
          >
            {translate(locale, 'project', showAdvanced ? 'HideOptions' : 'MoreOptions', customTranslations)}
          </Button>
        </HStack>

        {showAdvanced && (
          <VStack gap="xs" className="mt-1 pt-2 border-t border-border/40 animate-fade-in">
            <HStack gap="xs" className="w-full">
              <div className="w-1/3">
                <Input
                  type="text"
                  placeholder={translate(locale, 'project', 'IconPlaceholder', customTranslations)}
                  maxLength={2}
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-full px-2 py-1 text-center text-xs"
                />
              </div>
              <div className="w-2/3">
                <Input
                  type="text"
                  placeholder={translate(locale, 'project', 'TagsPlaceholder', customTranslations)}
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full px-2 py-1 text-xs"
                />
              </div>
            </HStack>
            <Textarea
              placeholder={translate(locale, 'project', 'DescriptionPlaceholder', customTranslations)}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-2 py-1 text-xs min-h-[40px] h-10 resize-none"
            />
          </VStack>
        )}

        <HStack justify="between" wrap className="gap-section mt-1.5">
          <InlineCluster gap="xs">
            {PROJECT_COLORS.map(col => {
              const isSelected = color === col.name;
              return (
                <Button
                  id={`color-picker-${col.name}`}
                  key={col.name}
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleColorChange(col.name)}
                  className={`w-6 h-6 rounded-full ${col.bg} transition-all duration-300 transform hover:scale-110 flex items-center justify-center p-0 ${
                    isSelected ? 'ring-2 ring-orange-500 ring-offset-2 scale-105' : 'opacity-85'
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 bg-card rounded-full" />}
                </Button>
              );
            })}
          </InlineCluster>

          <Button
            id="add-project-btn"
            type="submit"
            variant="accent"
            disabled={isLoading}
            className="rounded-xl px-4 py-1 text-main font-bold shadow-md cursor-pointer flex items-center gap-1.5 h-auto"
          >
            <Plus className="icon-small" /> {translate(locale, 'common', 'Save', customTranslations)}
          </Button>
        </HStack>
      </VStack>
    </form>
  );
}
