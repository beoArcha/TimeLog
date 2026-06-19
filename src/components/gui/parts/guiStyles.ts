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
