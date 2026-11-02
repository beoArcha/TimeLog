import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import type { Project } from '@bindings/Project';
import { ProjectFormFields } from '@features/projects/components/ProjectFormFields';

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
  const [name, setName] = useState(project.name);
  const [color, setColor] = useState(project.color);
  const [description, setDescription] = useState(project.description || '');
  const [icon, setIcon] = useState(project.icon || '');
  const [tags, setTags] = useState(project.tags ? project.tags.join(', ') : '');
  const [allowConcurrency, setAllowConcurrency] = useState(Boolean(project.allowConcurrency));
  const [hourlyRate, setHourlyRate] = useState(project.hourlyRate ?? '');
  const [currency, setCurrency] = useState(project.currency ?? '');

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
        <ProjectFormFields.Name
          idPrefix="edit-project"
          showLabel
          value={name}
          onChange={setName}
          locale={locale}
          customTranslations={customTranslations}
          className="w-full"
        />

        <div className="grid grid-cols-2 gap-4">
          <ProjectFormFields.Emoji
            idPrefix="edit-project"
            showLabel
            value={icon}
            onChange={setIcon}
            locale={locale}
            customTranslations={customTranslations}
          />

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
              {translate(locale, 'project', 'ColorTheme', customTranslations)}
            </Label>
            <ProjectFormFields.ColorPalette
              idPrefix="edit-project"
              color={color}
              onChange={setColor}
              selectedRingClass="ring-2 ring-primary ring-offset-2 scale-105"
              locale={locale}
              customTranslations={customTranslations}
              className="flex flex-wrap gap-1.5 mt-1"
            />
          </div>
        </div>

        <ProjectFormFields.Description
          idPrefix="edit-project"
          showLabel
          value={description}
          onChange={setDescription}
          locale={locale}
          customTranslations={customTranslations}
          className="w-full h-16 resize-none"
        />

        <ProjectFormFields.Tags
          idPrefix="edit-project"
          showLabel
          showSuggestions
          value={tags}
          onChange={setTags}
          locale={locale}
          customTranslations={customTranslations}
          className="w-full"
        />

        <ProjectFormFields.Rates
          idPrefix="edit-project"
          showLabels
          containerLayout="grid"
          hourlyRate={hourlyRate}
          onHourlyRateChange={setHourlyRate}
          currency={currency}
          onCurrencyChange={setCurrency}
          locale={locale}
          customTranslations={customTranslations}
          rateClassName="w-full"
          currencyClassName="w-full"
        />

        <ProjectFormFields.Concurrency
          idPrefix="edit-project"
          variant="boxed"
          checked={allowConcurrency}
          onCheckedChange={setAllowConcurrency}
          locale={locale}
          customTranslations={customTranslations}
        />
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
