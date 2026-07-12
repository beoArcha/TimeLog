import React, { useState } from 'react';
import { Edit3, Trash2, Check, X, History } from 'lucide-react';
import { TimeLog } from '@bindings/TimeLog';
import { translate } from '@common/i18n/i18n';
import { Locale } from '@bindings/Locale';

interface TimeLogTableRowProps {
  key?: any;
  l: TimeLog;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (startTime: string, endTime: string, note: string, reason: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  locale: Locale;
  customTranslations: any;
  showHistory: boolean;
  onToggleHistory: () => void;
}

export default function TimeLogTableRow({
  l,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  locale,
  customTranslations,
  showHistory,
  onToggleHistory
}: TimeLogTableRowProps) {
  const [form, setForm] = useState({
    startTime: l.startTime,
    endTime: l.endTime || '',
    note: l.note || '',
    reason: 'Błąd synchronizacji licznika / Korekta ręczna'
  });

  const hasHistory = !!(l.editHistory && l.editHistory.length > 0);

  const getOriginalStartTime = () => {
    if (!l.editHistory || l.editHistory.length === 0) return l.startTime;
    for (const h of l.editHistory) {
      if (h.prevStartTime) {
        return h.prevStartTime;
      }
    }
    return l.startTime;
  };

  const handleSave = () => {
    onSaveEdit(form.startTime, form.endTime, form.note, form.reason);
  };

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/5 text-left">
        <td className="py-3.5 px-4 font-bold text-slate-500">{l.id}</td>
        <td className="py-3.5 px-4 text-teal-400 font-bold">{l.taskId}</td>
        <td className="py-3.5 px-4">
          {isEditing ? (
            <input
              type="text"
              value={form.startTime}
              onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
              className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded text-white"
            />
          ) : (
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{l.startTime}</span>
          )}
        </td>
        <td className="py-3.5 px-4">
          {isEditing ? (
            <input
              type="text"
              value={form.endTime}
              onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
              className="bg-black/35 border border-white/20 select-text px-2 py-1 rounded text-white"
              placeholder="Koniec czasu lub puste"
            />
          ) : (
            <span className="text-indigo-400 font-semibold">{l.endTime || translate(locale, 'dbExplorer.trackingActive', customTranslations)}</span>
          )}
        </td>
        <td className="py-3.5 px-4 truncate max-w-xs">
          {isEditing ? (
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
              className="bg-black/35 border border-white/20 px-2 py-1 rounded text-white"
            />
          ) : (
            <span>{l.note || <span className="text-slate-500 italic">{translate(locale, 'dynamic.noNote', customTranslations)}</span>}</span>
          )}
        </td>
        <td className="py-3.5 px-4">
          {hasHistory ? (
            <span className="text-[10px] bg-amber-550/10 text-amber-500 border border-amber-550/25 px-2 py-0.5 rounded-md font-bold block w-max">
              Oryg start: {getOriginalStartTime() ? new Date(getOriginalStartTime()).toLocaleTimeString() : 'N/A'}
            </span>
          ) : (
            <span className="text-slate-500 text-[10px]">{translate(locale, 'dbExplorer.noChanges', customTranslations)}</span>
          )}
        </td>
        <td className="py-3.5 px-4 text-right">
          <div className="flex items-center justify-end gap-2">
            {hasHistory && (
              <button
                onClick={onToggleHistory}
                className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            )}
            {isEditing ? (
              <>
                <input
                  type="text"
                  placeholder="Uzasadnienie rzetelności"
                  value={form.reason}
                  onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="text-[9px] bg-black/45 border border-white/10 px-1 py-0.5 rounded w-32 text-white mr-1"
                />
                <button onClick={handleSave} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 cursor-pointer">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={onCancelEdit} className="p-1.5 rounded-lg bg-rose-500/25 hover:bg-rose-500/35 text-rose-450 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={onStartEdit} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={onDelete} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {showHistory && l.editHistory && (
        <tr>
          <td colSpan={7} className="py-3 px-5 bg-black/20 border-b border-white/5 rounded-b-2xl">
            <div className="flex flex-col gap-1 border-l-2 border-teal-500 pl-4 py-1 text-left">
              <p className="text-[10px] uppercase font-bold tracking-widest text-teal-400 flex items-center gap-1.5">
                <History className="w-3" /> Oryginał i historia korekt wpisu czasowego
              </p>
              {l.editHistory.map((h, hIdx) => (
                <div key={hIdx} className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  <span className="text-slate-500">[{new Date(h.editedAt).toLocaleString()}]</span>{' '}
                  Start: <strong className="text-white">"{h.prevStartTime}"</strong>, Koniec: <strong className="text-white">"{h.prevEndTime || 'Brak'}"</strong>, Notatka: <strong className="text-white">"{h.prevNote}"</strong> &rarr;{' '}
                  Uzasadnienie: <em className="text-teal-300">"{h.reason}"</em>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
