import React from 'react';
import { Text } from '@components/ui/typography';
import { cn } from '@/lib/utils';

export interface ShortcutTileProps {
  label: React.ReactNode;
  shortcut: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning';
}

export function ShortcutTile({
  label,
  shortcut,
  variant = 'default',
}: ShortcutTileProps) {
  const containerStyle = {
    default: 'border-border bg-card',
    danger: 'border-destructive/20 bg-destructive/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
  }[variant];

  const labelColor = {
    default: 'text-card-foreground',
    danger: 'text-destructive',
    warning: 'text-amber-500',
  }[variant];

  return (
    <div className={cn('p-3 rounded-xl border flex items-center justify-between', containerStyle)}>
      <Text size="xs" weight="bold" className={labelColor}>
        {label}
      </Text>
      <div>{shortcut}</div>
    </div>
  );
}

export default ShortcutTile;
