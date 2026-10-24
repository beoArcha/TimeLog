import type { UiSize, TypographySize } from '@common/types/designSystem';

export type { UiSize, TypographySize };

/**
 * Compact component size scale for dense controls (chips, status dots, icon buttons).
 */
export type CompactUiSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

/**
 * Common surface variant hierarchy for cards, containers, panels, and icon boxes.
 */
export type UiSurfaceVariant = 'default' | 'muted' | 'outline' | 'card' | 'ghost';

/**
 * Standard border radius tokens matching design system tokens.
 */
export type UiRoundedVariant = 'none' | 'sm' | 'md' | 'lg' | 'full' | 'section';

/**
 * Semantic status colors across indicators, badges, and alerts.
 */
export type UiStatusVariant = 'emerald' | 'amber' | 'rose' | 'orange' | 'blue' | 'muted';

/**
 * Standard polymorphic element tag for inline and container primitives.
 */
export type AsDivOrSpan = 'div' | 'span';
