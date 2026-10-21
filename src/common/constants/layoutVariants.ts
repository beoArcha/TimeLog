import { LayoutVariant } from '@bindings/LayoutVariant';

export const LAYOUT_VARIANTS = {
  COMPACT: 'compact',
  MEDIUM: 'medium',
  FULL: 'full',
} as const satisfies Record<string, LayoutVariant>;

export const isFullLayout = (variant: LayoutVariant | string): variant is 'full' =>
  variant === LAYOUT_VARIANTS.FULL;

export const isMediumLayout = (variant: LayoutVariant | string): variant is 'medium' =>
  variant === LAYOUT_VARIANTS.MEDIUM;

export const isCompactLayout = (variant: LayoutVariant | string): variant is 'compact' =>
  variant === LAYOUT_VARIANTS.COMPACT;
