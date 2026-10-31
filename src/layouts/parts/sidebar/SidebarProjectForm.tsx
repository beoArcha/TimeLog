import React from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
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

  const handleSubmit = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
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
    setColorLocal(initialColor);
    onColorChange?.(initialColor);
    setDescription('');
    setIcon('');
    setTags('');
    setAllowConcurrencyOverride(null);
    setShowAdvanced(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Form
      onSubmit={handleSubmit}
      layout="none"
      className="mb-6 padding-section rounded-section border border-border bg-muted/40 transition-all"
    >
      <VStack gap="xs" className="w-full">
        {/* Tier 1: Primary Level (Compact Main Row & Color Palette) */}
        <VStack gap="xs" className="w-full">
          <Input
            id="new-project-input"
            data-testid="new-project-input"
            type="text"
            placeholder={translate(locale, 'project', 'EnterProjectName', customTranslations)}
            aria-label={translate(locale, 'project', 'ProjectName', customTranslations)}
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-input bg-card text-foreground placeholder:text-muted-foreground px-3 input-py rounded-section text-main focus:outline-none focus:ring-2 focus:ring-orange-400 font-sans transition-all"
          />

          <HStack justify="between" align="center" wrap className="gap-2 pt-0.5">
            <InlineCluster gap="xs" align="center">
              {PROJECT_COLORS.map(col => {
                const isSelected = color === col.name;
                return (
                  <Button
                    id={`color-picker-${col.name}`}
                    data-testid={`color-picker-${col.name}`}
                    key={col.name}
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleColorChange(col.name)}
                    aria-label={col.name}
                    title={col.name}
                    className={`w-5 h-5 rounded-full ${col.bg} transition-all duration-200 transform hover:scale-110 flex items-center justify-center p-0 ${
                      isSelected ? 'ring-2 ring-orange-500 ring-offset-2 scale-105' : 'opacity-85'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 bg-card rounded-full" />}
                  </Button>
                );
              })}
            </InlineCluster>

            <HStack gap="xs" align="center">
              <Button
                id="sidebar-project-toggle-advanced"
                data-testid="sidebar-project-toggle-advanced"
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                aria-expanded={showAdvanced}
                aria-label={translate(
                  locale,
                  'project',
                  showAdvanced ? 'HideOptions' : 'MoreOptions',
                  customTranslations
                )}
                title={translate(
                  locale,
                  'project',
                  showAdvanced ? 'HideOptions' : 'MoreOptions',
                  customTranslations
                )}
                className="font-mono text-xs text-muted-foreground hover:text-orange-500 transition-colors flex items-center gap-1 h-auto p-1"
              >
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span className="text-[11px] uppercase tracking-wider">
                  {translate(
                    locale,
                    'project',
                    showAdvanced ? 'HideOptions' : 'MoreOptions',
                    customTranslations
                  )}
                </span>
              </Button>

              <Button
                id="add-project-btn"
                data-testid="add-project-btn"
                type="submit"
                variant="accent"
                disabled={isLoading}
                aria-label={translate(locale, 'project', 'AddNewProject', customTranslations)}
                title={translate(locale, 'project', 'AddNewProject', customTranslations)}
                className="rounded-xl px-3 py-1 text-main font-bold shadow-md cursor-pointer flex items-center gap-1.5 h-auto shrink-0"
              >
                <Plus className="icon-small" />
                <span>{translate(locale, 'project', 'AddNewProject', customTranslations)}</span>
              </Button>
            </HStack>
          </HStack>
        </VStack>

        {/* Tier 2: Advanced Level (Collapsible Drawer / Panel) */}
        {showAdvanced && (
          <VStack
            id="sidebar-project-advanced-drawer"
            data-testid="sidebar-project-advanced-drawer"
            gap="xs"
            className="mt-2 pt-2 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <HStack gap="xs" className="w-full">
              <div className="flex items-center gap-1.5 w-1/3">
                <EmojiPicker
                  value={icon}
                  onChange={setIcon}
                  testId="sidebar-project-emoji-picker"
                />
                <Input
                  id="sidebar-project-icon-input"
                  data-testid="sidebar-project-icon-input"
                  type="text"
                  placeholder={translate(locale, 'project', 'IconPlaceholder', customTranslations)}
                  aria-label={translate(locale, 'project', 'EmojiIcon', customTranslations)}
                  value={icon}
                  onChange={e => setIcon(getFirstGrapheme(e.target.value))}
                  className="w-full px-2 py-1 text-center text-xs"
                />
              </div>
              <div className="w-2/3">
                <Input
                  id="sidebar-project-tags-input"
                  data-testid="sidebar-project-tags-input"
                  type="text"
                  placeholder={translate(locale, 'project', 'TagsPlaceholder', customTranslations)}
                  aria-label={translate(locale, 'project', 'Tags', customTranslations)}
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full px-2 py-1 text-xs"
                />
              </div>
            </HStack>

            <Textarea
              id="sidebar-project-description-input"
              data-testid="sidebar-project-description-input"
              placeholder={translate(locale, 'project', 'DescriptionPlaceholder', customTranslations)}
              aria-label={translate(locale, 'project', 'Description', customTranslations)}
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
                data-testid="new-project-concurrency"
                checked={allowConcurrency}
                onCheckedChange={setAllowConcurrencyOverride}
              />
            </HStack>
          </VStack>
        )}
      </VStack>
    </Form>
  );
}
