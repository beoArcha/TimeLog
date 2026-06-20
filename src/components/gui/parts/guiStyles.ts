export const getThemeStyles = (theme: string) => ({
  bgMuted: theme === 'light' ? 'bg-[#F4EFEA]' : 'bg-black/20',
  bgCard: theme === 'light' ? 'bg-[#FCFAF8]' : 'bg-[#FCFAF8]/5',
  textMain: theme === 'light' ? 'text-[#2C2421]' : 'text-white',
  textMuted: theme === 'light' ? 'text-[#7A6A61]' : 'text-[#9B8C83]',
  border: theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10',
  borderHl: theme === 'light' ? 'border-[#D0C5B5]' : 'border-white/20',
  shadow: theme === 'light' ? 'shadow-sm shadow-[#2C2421]/5' : 'shadow-lg shadow-black/50',
  bgBadge: theme === 'light' ? 'bg-[#EAE4DB]' : 'bg-[#FCFAF8]/10'
});

export const PROJECT_COLORS = [
  { name: 'rose', bg: 'bg-rose-500', hex: '#f43f5e', text: 'text-rose-500' },
  { name: 'teal', bg: 'bg-teal-500', hex: '#14b8a6', text: 'text-teal-500' },
  { name: 'amber', bg: 'bg-amber-500', hex: '#f59e0b', text: 'text-amber-500' },
  { name: 'violet', bg: 'bg-violet-500', hex: '#8b5cf6', text: 'text-violet-500' },
  { name: 'indigo', bg: 'bg-indigo-500', hex: '#6366f1', text: 'text-indigo-500' },
  { name: 'emerald', bg: 'bg-emerald-500', hex: '#10b981', text: 'text-emerald-500' },
];

export const GUI_MIN_SIZES = {
  medium: {
    'small': { minWidth: '480px', minHeight: '720px' },
    'medium': { minWidth: '640px', minHeight: '1080px' },
    'large': { minWidth: '864px', minHeight: '1440px' }
  },
  large: {
    'small': { minWidth: '1280px', minHeight: '720px' },
    'medium': { minWidth: '1920px', minHeight: '1080px' },
    'large': { minWidth: '2560px', minHeight: '1440px' }
  }
};

import { TextAndIconSize } from '../../../bindings/TextAndIconSize';

export const getScaleStyles = (scale: TextAndIconSize) => {
  switch (scale) {
    case 'small':
      return {
        paddingMain: 'p-4',
        paddingSection: 'p-3',
        gapMain: 'gap-3',
        gapSection: 'gap-2',
        roundedMain: 'rounded-2xl',
        roundedSection: 'rounded-xl',
        textMain: 'text-xs',
        textTitle: 'text-sm',
        textGiant: 'text-xl',
        iconSmall: 'w-3 h-3',
        iconMedium: 'w-4 h-4',
        iconLarge: 'w-6 h-6',
        inputPy: 'py-2',
      };
    case 'medium':
      return {
        paddingMain: 'p-6',
        paddingSection: 'p-4',
        gapMain: 'gap-5',
        gapSection: 'gap-3',
        roundedMain: 'rounded-3xl',
        roundedSection: 'rounded-2xl',
        textMain: 'text-sm',
        textTitle: 'text-base',
        textGiant: 'text-3xl',
        iconSmall: 'w-4 h-4',
        iconMedium: 'w-5 h-5',
        iconLarge: 'w-8 h-8',
        inputPy: 'py-3',
      };
    case 'large':
      return {
        paddingMain: 'p-8',
        paddingSection: 'p-6',
        gapMain: 'gap-8',
        gapSection: 'gap-5',
        roundedMain: 'rounded-[2.5rem]',
        roundedSection: 'rounded-3xl',
        textMain: 'text-base',
        textTitle: 'text-xl',
        textGiant: 'text-5xl',
        iconSmall: 'w-5 h-5',
        iconMedium: 'w-7 h-7',
        iconLarge: 'w-10 h-10',
        inputPy: 'py-4',
      };
    default:
      return getScaleStyles('medium');
  }
};
