import React, { useState } from 'react';
import { translate } from '@common/i18n/i18n';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Locale } from '@bindings/Locale';

interface AddLogFormProps {
  tasks: Task[];
  projects: Project[];
  locale: Locale;
  customTranslations: any;
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
      alert('Najpierw wybierz zadanie!');
      return;
    }
    onSubmit(form.taskId, form.startTime, form.endTime, form.note);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col gap-3">
      <p className="text-xs font-bold text-orange-400 uppercase tracking-wide">SQL Command: INSERT INTO time_logs</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">{translate(locale, 'dbExplorer.assignToTask', customTranslations)}</label>
          <select 
            value={form.taskId} 
            onChange={e => setForm(prev => ({ ...prev, taskId: e.target.value }))}
            className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none"
            required
          >
            <option value="">{translate(locale, 'dynamic.selectTask', customTranslations)}</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{projects.find(p => p.id === t.projectId)?.name} &gt; {t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 mb-1">{translate(locale, 'dbExplorer.startTime', customTranslations)}</label>
          <input 
            type="text" 
            value={form.startTime} 
            onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
            className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none select-text" 
            required
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">{translate(locale, 'dbExplorer.endTime', customTranslations)}</label>
          <input 
            type="text" 
            value={form.endTime} 
            onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
            className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none select-text" 
            placeholder="Wprowadź ISO lub pozostaw puste"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">{translate(locale, 'dbExplorer.note', customTranslations)}</label>
          <input 
            type="text" 
            value={form.note} 
            onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
            className="w-full bg-slate-900 border border-white/10 p-2 rounded-xl text-white outline-none placeholder-slate-500" 
            placeholder="np. Dodane wstecznie za wtorek"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end mt-2">
        <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-650 text-white font-bold rounded-xl text-xs cursor-pointer">
          Zatwierdź SQL INSERT
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer">
          Anuluj
        </button>
      </div>
    </form>
  );
}
