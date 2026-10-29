import React from 'react';
import { Plus } from 'lucide-react';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import { PROJECT_COLORS } from '@common/constants/projectColors';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Form } from '@components/ui/form';
import { Textarea } from '@components/ui/textarea';
import { Switch } from '@components/ui/switch';
import { Label } from '@components/ui/label';
import { Caption } from '@components/ui/typography';
import { VStack, HStack, InlineCluster } from '@components/ui/stack';
import { EmojiPicker, getFirstGrapheme } from '@components/ui/emoji-picker';
import { useSettingsSafe } from '@common/hooks/SettingsContext';

export interface SidebarProjectFormProps {
  onAddProject: (
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null,
    allowConcurrency?: boolean | null
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
  const settings = useSettingsSafe();
  const defaultConcurrency = settings?.defaultProjectConcurrency ?? false;
  const [name, setNameLocal] = React.useState(initialName);
  const [color, setColorLocal] = React.useState(initialColor);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [icon, setIcon] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [allowConcurrencyOverride, setAllowConcurrencyOverride] = React.useState<boolean | null>(null);
  const allowConcurrency = allowConcurrencyOverride ?? defaultConcurrency;

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
      tagsArr.length > 0 ? tagsArr : null,
      allowConcurrency
    );

    handleNameChange('');
    setDescription('');
    setIcon('');
    setTags('');
    setAllowConcurrencyOverride(null);
    setShowAdvanced(false);
  };

  return (
    <Form onSubmit={handleSubmit} layout="none" className="mb-6 padding-section rounded-section border border-border bg-muted/40 transition-all">
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
              <div className="flex items-center gap-1.5 w-1/3">
                <EmojiPicker
                  value={icon}
                  onChange={setIcon}
                  testId="sidebar-project-emoji-picker"
                />
                <Input
                  id="sidebar-project-icon-input"
                  type="text"
                  placeholder={translate(locale, 'project', 'IconPlaceholder', customTranslations)}
                  value={icon}
                  onChange={e => setIcon(getFirstGrapheme(e.target.value))}
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
            <HStack justify="between" align="center" className="w-full pt-1">
              <VStack gap="none">
                <Label htmlFor="new-project-concurrency" className="text-xs font-medium cursor-pointer">
                  {translate(locale, 'project', 'AllowConcurrency', customTranslations)}
                </Label>
                <Caption size="xs" variant="muted">
                  {translate(locale, 'project', 'AllowConcurrencyDesc', customTranslations)}
                </Caption>
              </VStack>
              <Switch
                id="new-project-concurrency"
                checked={allowConcurrency}
                onCheckedChange={setAllowConcurrencyOverride}
              />
            </HStack>
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
    </Form>
  );
}
