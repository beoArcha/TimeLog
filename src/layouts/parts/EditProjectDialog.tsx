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
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Label } from '@components/ui/label';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';
import type { Project } from '@bindings/Project';
import { PROJECT_COLORS } from '@common/constants/projectColors';

export type ProjectToEdit = Pick<Project, 'id' | 'name' | 'color' | 'description' | 'icon' | 'tags'>;

export interface EditProjectSavePayload {
  id: string;
  name: string;
  color: string;
  description: string | null;
  icon: string | null;
  tags: string[] | null;
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
            <Label htmlFor="edit-project-icon-input" className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
              {translate(locale, 'project', 'EmojiIcon', customTranslations)}
            </Label>
            <Input
              id="edit-project-icon-input"
              type="text"
              placeholder="🚀"
              maxLength={2}
              value={icon}
              onChange={e => setIcon(e.target.value)}
              className="w-full text-center text-xl"
            />
          </div>

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
              {translate(locale, 'project', 'ColorTheme', customTranslations)}
            </Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PROJECT_COLORS.map(col => (
                <Button
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
