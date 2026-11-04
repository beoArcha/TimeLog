import React from 'react';

export interface BackgroundGradientsProps {
  className?: string;
}

export default function BackgroundGradients({ className = '' }: BackgroundGradientsProps = {}) {
  return (
    <div className={`ambient-gradients pointer-events-none ${className}`} aria-hidden="true">
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
