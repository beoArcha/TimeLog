import React from 'react';
import { cn } from '@/lib/utils';
import { PROJECT_COLORS } from '@/src/layouts/parts/LayoutStyles';

export interface ProjectBadgeProps {
  name: string;
  color?: string | null;
  icon?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
  dotClassName?: string;
  textClassName?: string;
}

/**
 * Reusable badge displaying a project color indicator (or icon) and project name.
 */
export function ProjectBadge({
  name,
  color,
  icon,
  size = 'md',
  showName = true,
  className,
  dotClassName,
  textClassName,
}: ProjectBadgeProps) {
  const matchedColor = PROJECT_COLORS.find(c => c.name === color);
  const colorBg = matchedColor?.bg;
  const inlineBg = !colorBg && color
    ? (color.startsWith('#') || color.startsWith('rgb') ? color : `var(--tw-color-${color}-500, #f97316)`)
    : undefined;

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  }[size];

  const textSizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
  }[size];

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 min-w-0', className)}
      title={name.length > 512 ? `${name.slice(0, 512)}...` : name}
    >
      {icon ? (
        <span className="shrink-0 leading-none select-none" aria-hidden="true">
          {icon}
        </span>
      ) : (
        <span
          className={cn(
            'rounded-full shrink-0 shadow-xs ring-1 ring-white/10',
            dotSizeClasses,
            colorBg ?? 'bg-orange-500',
            dotClassName
          )}
          style={inlineBg ? { backgroundColor: inlineBg } : undefined}
          aria-hidden="true"
        />
      )}
      {showName && (
        <span className={cn('truncate font-sans leading-none', textSizeClasses, textClassName)}>
          {name}
        </span>
      )}
    </span>
  );
}

export default ProjectBadge;
