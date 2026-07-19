import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle } from 'lucide-react';
import { useOxyFlow } from '@common/hooks/OxyContext';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function PromptModal({
  isOpen,
  title,
  message,
  defaultValue = '',
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const { resolvedTheme } = useOxyFlow();
  const [value, setValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 flex flex-col gap-4 relative ${
            resolvedTheme === 'light'
              ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]'
              : resolvedTheme === 'high-contrast'
              ? 'bg-black border-2 border-white text-white'
              : 'bg-slate-950 border-white/10 text-white'
          }`}
        >
          <button
            onClick={onCancel}
            className={`absolute top-5 right-5 p-1.5 rounded-xl transition-colors cursor-pointer ${
              resolvedTheme === 'light' ? 'hover:bg-[#EAE4DB] text-[#5A4A42]' : 'hover:bg-white/10 text-[#9B8C83]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{title}</h3>
              <p className="text-xs text-[#9B8C83] mt-0.5">{message}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono border transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
                resolvedTheme === 'light'
                  ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421]'
                  : 'bg-slate-900 border-white/10 text-white'
              }`}
            />

            <div className="flex justify-end gap-2.5 mt-1">
              <button
                type="button"
                onClick={onCancel}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  resolvedTheme === 'light'
                    ? 'border-[#DFD7CB] text-[#5A4A42] hover:bg-[#EAE4DB]'
                    : 'border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 rounded-xl shadow-md cursor-pointer transition-all"
              >
                Zatwierdź
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
