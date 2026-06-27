import React from 'react';
import { motion } from 'motion/react';
import { Locale } from '@bindings/Locale';
import { translate } from '@common/i18n/i18n';
import { CommonKey } from '@common/i18n/keys/CommonKey';

interface SubtaskFormProps {
  parentTaskId: string;
  newSubtaskName: string;
  theme: string;
  locale: Locale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customTranslations: any;
  setNewSubtaskName: (name: string) => void;
  onSubmit: (parentTaskId: string, e: React.FormEvent) => void;
}

export function SubtaskForm({
  parentTaskId,
  newSubtaskName,
  theme,
  locale,
  customTranslations,
  setNewSubtaskName,
  onSubmit,
}: SubtaskFormProps) {
  return (
    <motion.form
      id={`subtask-form-${parentTaskId}`}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      onSubmit={(e) => onSubmit(parentTaskId, e)}
      className={`p-2.5 rounded-2xl border flex gap-2 ml-8 mt-1 ${
        theme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB]' : 'bg-[#FCFAF8]/5 border-white/10'
      }`}
    >
      <input
        id={`new-subtask-input-${parentTaskId}`}
        type="text"
        required
        placeholder={translate(locale, 'dynamic.enterSubtaskName', customTranslations)}
        value={newSubtaskName}
        onChange={(e) => setNewSubtaskName(e.target.value)}
        className={`flex-1 px-3 py-1.5 border rounded-xl text-xs focus:outline-none transition-all ${
          theme === 'light'
            ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421] placeholder-[#9B8C83]'
            : 'bg-slate-950 text-white border-white/10 placeholder-[#8A7A71]'
        }`}
      />
      <button
        id={`submit-subtask-btn-${parentTaskId}`}
        type="submit"
        className="bg-gradient-to-tr from-orange-400 to-rose-500 text-white text-xs font-semibold rounded-xl px-3 py-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
      >
        {translate(locale, CommonKey.Save, customTranslations)}
      </button>
    </motion.form>
  );
}
