import React, { useState, useRef } from 'react';
import { Pencil, Paintbrush } from 'lucide-react';
import { isValidHexColor, normalizeHexColor } from '@common/utils/colorUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Label } from '@components/ui/label';
import { Caption } from '@components/ui/typography';
import { Switch } from '@components/ui/switch';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import type { Project } from '@bindings/Project';
import { PROJECT_COLORS } from '@common/constants/projectColors';
import { EmojiPicker } from '@components/EmojiPicker';
import { useAllProjectTags } from '@common/hooks/useAllProjectTags';

export type ProjectToEdit = Pick<
  Project,
  'id' | 'name' | 'color' | 'description' | 'icon' | 'tags' | 'allowConcurrency' | 'hourlyRate' | 'currency'
>;

export interface EditProjectSavePayload {
  id: string;
  name: string;
  color: string;
  description: string | null;
  icon: string | null;
  tags: string[] | null;
  allowConcurrency: boolean;
  hourlyRate: string | null;
  currency: string | null;
}

export interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectToEdit | null;
  onSave: (payload: EditProjectSavePayload) => void;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

interface EditProjectDialogFormProps {
  key?: React.Key;
  project: ProjectToEdit;
  onOpenChange: (open: boolean) => void;
  onSave: EditProjectDialogProps['onSave'];
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

function EditProjectDialogForm({
  project,
  onOpenChange,
  onSave,
  locale = 'en',
  customTranslations,
}: EditProjectDialogFormProps) {
  const availableTags = useAllProjectTags();
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const [description, setDescription] = useState(project.description || '');
  const [icon, setIcon] = useState(project.icon || '');
  const [tags, setTags] = useState(project.tags ? project.tags.join(', ') : '');
  const [allowConcurrency, setAllowConcurrency] = useState(Boolean(project.allowConcurrency));
  const [hourlyRate, setHourlyRate] = useState(project.hourlyRate ?? '');
  const [currency, setCurrency] = useState(project.currency ?? '');
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isCustomColor = isValidHexColor(color);

  const handleAddTagSuggestion = (tagToAdd: string) => {
    const currentTags = tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    if (!currentTags.includes(tagToAdd)) {
      const updated = [...currentTags, tagToAdd].join(', ');
      setTags(updated);
    }
  };

  const handleCustomColorClick = () => {
    if (!isCustomColor) {
      const currentHex = colorInputRef.current?.value || '#8b5cf6';
      setColor(currentHex);
    }
    colorInputRef.current?.click();
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave({
      id: project.id,
      name: name.trim(),
      color,
      description: description.trim() || null,
      icon: icon.trim() || null,
      tags: tagsArr.length > 0 ? tagsArr : null,
      allowConcurrency,
      hourlyRate: hourlyRate.trim() || null,
      currency: currency.trim() || null,
    });
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Pencil className="w-5 h-5 text-primary" />
          {translate(locale, 'project', 'EditProjectTitle', customTranslations)}
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-4 my-2">
        <div>
          <Label htmlFor="edit-project-name-input" className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            {translate(locale, 'project', 'ProjectName', customTranslations)}
          </Label>
          <Input
            id="edit-project-name-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
              {translate(locale, 'project', 'EmojiIcon', customTranslations)}
            </Label>
            <div className="flex items-center gap-2">
              <EmojiPicker
                value={icon}
                onChange={setIcon}
                testId="edit-project-emoji-picker"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
              {translate(locale, 'project', 'ColorTheme', customTranslations)}
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PROJECT_COLORS.map(col => (
                <Button
                  id={`edit-project-color-picker-${col.name}`}
                  data-testid={`edit-project-color-picker-${col.name}`}
                  key={col.name}
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setColor(col.name)}
                  aria-label={col.name}
                  className={`w-5 h-5 rounded-full ${col.bg} transition-all duration-300 transform hover:scale-110 flex items-center justify-center p-0 ${
                    color === col.name ? 'ring-2 ring-primary ring-offset-2 scale-105' : 'opacity-85'
                  }`}
                >
                  {color === col.name && (
                    <span className="w-1 h-1 bg-card rounded-full" />
                  )}
                </Button>
              ))}

              <Button
                id="edit-project-color-picker-custom"
                data-testid="edit-project-color-picker-custom"
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={handleCustomColorClick}
                aria-label={translate(locale, 'project', 'CustomColorPicker', customTranslations)}
                title={translate(locale, 'project', 'CustomColorPicker', customTranslations)}
                style={isCustomColor ? { backgroundColor: color } : undefined}
                className={`w-5 h-5 rounded-full border border-border transition-all duration-300 transform hover:scale-110 flex items-center justify-center p-0 ${
                  isCustomColor
                    ? 'ring-2 ring-primary ring-offset-2 scale-105 text-white'
                    : 'opacity-85 bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Paintbrush className="w-2.5 h-2.5" />
              </Button>
              <Input
                ref={colorInputRef}
                id="edit-project-custom-color-input"
                data-testid="edit-project-custom-color-input"
                type="color"
                value={isCustomColor ? normalizeHexColor(color) : '#8b5cf6'}
                onChange={e => setColor(e.target.value)}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="edit-project-desc-input" className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            {translate(locale, 'project', 'Description', customTranslations)}
          </Label>
          <Textarea
            id="edit-project-desc-input"
            placeholder={translate(locale, 'project', 'DescriptionPlaceholder', customTranslations)}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full h-16 resize-none"
          />
        </div>

        <div>
          <Label htmlFor="edit-project-tags-input" className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            {translate(locale, 'project', 'Tags', customTranslations)}
          </Label>
          <Input
            id="edit-project-tags-input"
            type="text"
            placeholder={translate(locale, 'project', 'TagsPlaceholder', customTranslations)}
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="w-full"
          />
          {availableTags.length > 0 && (
            <div className="mt-2 flex flex-col gap-1" data-testid="edit-project-tag-suggestions">
              <Caption size="xs" variant="muted" className="font-mono text-[10px] uppercase tracking-wider block">
                {translate(locale, 'project', 'TagSuggestionsLabel', customTranslations)}
              </Caption>
              <div className="flex flex-wrap gap-1">
                {availableTags.map(tag => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleAddTagSuggestion(tag)}
                    data-testid={`tag-suggestion-${tag}`}
                    className="h-5 px-2 py-0 text-[10px] rounded-full font-normal cursor-pointer"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-project-hourly-rate" className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
              {translate(locale, 'project', 'HourlyRate', customTranslations)}
            </Label>
            <Input
              id="edit-project-hourly-rate"
              data-testid="edit-project-hourly-rate"
              type="text"
              placeholder={translate(locale, 'project', 'HourlyRatePlaceholder', customTranslations)}
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label htmlFor="edit-project-currency" className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
              {translate(locale, 'project', 'Currency', customTranslations)}
            </Label>
            <Input
              id="edit-project-currency"
              data-testid="edit-project-currency"
              type="text"
              placeholder={translate(locale, 'project', 'CurrencyPlaceholder', customTranslations)}
              value={currency}
              onChange={e => setCurrency(e.target.value.toUpperCase())}
              maxLength={4}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="edit-project-concurrency-switch" className="text-sm font-medium cursor-pointer">
              {translate(locale, 'project', 'AllowConcurrency', customTranslations)}
            </Label>
            <span className="text-xs text-muted-foreground">
              {translate(locale, 'project', 'AllowConcurrencyDesc', customTranslations)}
            </span>
          </div>
          <Switch
            id="edit-project-concurrency-switch"
            checked={allowConcurrency}
            onCheckedChange={setAllowConcurrency}
          />
        </div>
      </div>

      <DialogFooter className="mt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {translate(locale, 'common', 'Cancel', customTranslations)}
        </Button>
        <Button
          id="save-edit-project-btn"
          type="button"
          variant="accent"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          {translate(locale, 'common', 'Save', customTranslations)}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  onSave,
  locale = 'en',
  customTranslations,
}: EditProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {project && (
          <EditProjectDialogForm
            key={project.id}
            project={project}
            onOpenChange={onOpenChange}
            onSave={onSave}
            locale={locale}
            customTranslations={customTranslations}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EditProjectDialog;
