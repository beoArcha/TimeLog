import React from 'react';
import { Theme } from '@common/types/ThemeTypes';

export interface BackgroundGradientsProps {
  theme?: Theme;
}

export default function BackgroundGradients(_props: BackgroundGradientsProps = {}) {
  return (
    <div className="ambient-gradients pointer-events-none" aria-hidden="true">
      <div
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none animate-pulse duration-[8000ms] bg-ambient-1"
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[70%] rounded-full blur-[130px] pointer-events-none animate-pulse duration-[10000ms] bg-ambient-2"
      />
      <div
        className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none bg-ambient-3"
      />
    </div>
  );
}
