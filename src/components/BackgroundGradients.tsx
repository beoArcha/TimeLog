import React from 'react';

import { Theme } from '@common/types/ThemeTypes';

export default function BackgroundGradients({ theme }: { theme: Theme }) {
  if (theme === 'high-contrast') return null;

  return (
    <>
      <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none animate-pulse duration-[8000ms] ${
        theme === 'light' ? 'bg-orange-500/5' : 'bg-orange-500/10'
      }`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[70%] rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms] ${
        theme === 'light' ? 'bg-rose-500/5' : 'bg-rose-500/10'
      }`} />
      <div className={`absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none ${
        theme === 'light' ? 'bg-violet-500/5' : 'bg-violet-500/10'
      }`} />
    </>
  );
}
