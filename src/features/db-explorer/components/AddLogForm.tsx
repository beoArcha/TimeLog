import React, { useState } from 'react';
import { translate } from '@common/i18n/translator';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Locale } from '@bindings/Locale';
import { Label } from '@components/ui/label';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Button } from '@components/ui/button';
import { Form } from '@components/ui/form';
import { Caption } from '@components/ui/typography';

interface AddLogFormProps {
  tasks: Task[];
  projects: Project[];
  locale: Locale;
  customTranslations: Record<string, unknown>;
  onSubmit: (taskId: string, startTime: string, endTime: string, note: string) => void;
  onCancel: () => void;
}

export default function AddLogForm({
  tasks,
  projects,
  locale,
  customTranslations,
  onSubmit,
  onCancel
}: AddLogFormProps) {
  const [form, setForm] = useState({
    taskId: tasks[0]?.id || '',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.taskId) {
      alert(translate(locale, 'task', 'TaskRequired', customTranslations));
      return;
    }
    onSubmit(form.taskId, form.startTime, form.endTime, form.note);
  };

  const selectedTask = tasks.find(t => t.id === form.taskId);
  const selectedProject = selectedTask ? projects.find(p => p.id === selectedTask.projectId) : null;
  const selectDisplay = selectedTask ? `${selectedProject?.name || ''} > ${selectedTask.name}` : translate(locale, 'task', 'SelectTaskPlaceholder', customTranslations);

  return (
    <Form onSubmit={handleSubmit} layout="vertical" gap="md" className="mb-6 p-4 rounded-2xl bg-black/30 border border-white/5">
      <Caption weight="bold" className="text-orange-400 uppercase tracking-wide">SQL Command: INSERT INTO time_logs</Caption>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div>
          <Label htmlFor="add-log-task" className="block text-muted-foreground mb-1">{translate(locale, 'database', 'AssignToTask', customTranslations)}</Label>
          <Select
            value={form.taskId}
            onValueChange={val => {
              if (val) setForm(prev => ({ ...prev, taskId: val }));
            }}
          >
            <SelectTrigger id="add-log-task" aria-label={translate(locale, 'database', 'AssignToTask', customTranslations)} className="w-full bg-slate-900 border border-white/10 p-2 text-white">
              <SelectValue>{selectDisplay}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tasks.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {projects.find(p => p.id === t.projectId)?.name} &gt; {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="add-log-start" className="block text-muted-foreground mb-1">{translate(locale, 'database', 'StartTime', customTranslations)}</Label>
          <Input
            id="add-log-start"
            aria-label={translate(locale, 'database', 'StartTime', customTranslations)}
            type="text"
            value={form.startTime}
            onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
            className="w-full bg-slate-900 border border-white/10 p-2 text-white"
            required
          />
        </div>
        <div>
          <Label htmlFor="add-log-end" className="block text-muted-foreground mb-1">{translate(locale, 'database', 'EndTime', customTranslations)}</Label>
          <Input
            id="add-log-end"
            aria-label={translate(locale, 'database', 'EndTime', customTranslations)}
            type="text"
            value={form.endTime}
            onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
            className="w-full bg-slate-900 border border-white/10 p-2 text-white"
            placeholder="Enter ISO or leave blank"
          />
        </div>
        <div>
          <Label htmlFor="add-log-note" className="block text-muted-foreground mb-1">{translate(locale, 'database', 'Note', customTranslations)}</Label>
          <Input
            id="add-log-note"
            aria-label={translate(locale, 'database', 'Note', customTranslations)}
            type="text"
            value={form.note}
            onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
            className="w-full bg-slate-900 border border-white/10 p-2 text-white placeholder-slate-500"
            placeholder="e.g. Added retrospectively"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-2">
        <Button type="submit" variant="accent" size="sm" aria-label={translate(locale, 'database', 'AddLogManually', customTranslations)}>
          {translate(locale, 'database', 'AddLogManually', customTranslations)}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} aria-label={translate(locale, 'common', 'Cancel', customTranslations)}>
          {translate(locale, 'common', 'Cancel', customTranslations)}
        </Button>
      </div>
    </Form>
  );
}
