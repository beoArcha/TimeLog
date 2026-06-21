export const THEME_COLORS = {
  light: {
    bg: 'bg-[#F4EFEA]',
    text: 'text-[#2C2421]',
    textMuted: 'text-slate-600',
    border: 'border-[#DFD7CB]',
    cardBg: 'bg-white/90',
    headerBg: 'bg-[#EAE4DB]',
    selectionBg: 'selection:bg-orange-500/20',
    selectionText: 'selection:text-orange-950',
    primaryBlock: 'bg-[#2C2421] text-[#F4EFEA]'
  },
  dark: {
    bg: 'bg-[#0b0f19]',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    border: 'border-white/10',
    cardBg: 'bg-black/50',
    headerBg: 'bg-white/5',
    selectionBg: 'selection:bg-orange-500/30',
    selectionText: 'selection:text-white',
    primaryBlock: 'bg-white/10 text-white'
  },
  highContrast: {
    bg: 'bg-black',
    text: 'text-white',
    textMuted: 'text-gray-300',
    border: 'border-white/30',
    cardBg: 'bg-zinc-900',
    headerBg: 'bg-zinc-800',
    selectionBg: 'selection:bg-yellow-500/30',
    selectionText: 'selection:text-white',
    primaryBlock: 'bg-white text-black'
  }
};

import { Theme } from '@common/types/ThemeTypes';

export const getThemeStyles = (theme: Theme) => {
  if (theme === 'light') return THEME_COLORS.light;
  if (theme === 'high-contrast') return THEME_COLORS.highContrast;
  return THEME_COLORS.dark;
};
