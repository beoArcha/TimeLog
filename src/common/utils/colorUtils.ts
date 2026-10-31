import {
  PROJECT_COLORS,
  ProjectColorDefinition,
  DEFAULT_PROJECT_COLOR,
  HEX_COLOR_REGEX,
} from '@common/constants/projectColors';

export interface ProjectColorStyle {
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
}

export interface ResolvedProjectColor {
  isHex: boolean;
  color: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  style: ProjectColorStyle;
  bgStyle: { backgroundColor?: string };
  borderStyle: { borderColor?: string };
  textStyle: { color?: string };
}

const DEFAULT_PROJECT_COLOR_DEF: ProjectColorDefinition =
  PROJECT_COLORS.find((c) => c.name === DEFAULT_PROJECT_COLOR) ?? PROJECT_COLORS[0];

export function isValidHexColor(color: string | null | undefined): boolean {
  if (!color) return false;
  return HEX_COLOR_REGEX.test(color.trim());
}

export function normalizeHexColor(hex: string): string {
  const trimmed = hex.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return DEFAULT_PROJECT_COLOR_DEF.hex;
  }
  const raw = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  if (raw.length === 3) {
    const r = raw[0];
    const g = raw[1];
    const b = raw[2];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return `#${raw}`.toLowerCase();
}

export function isPaletteColor(color: string | null | undefined): boolean {
  if (!color) return false;
  const normalized = color.trim().toLowerCase();
  return PROJECT_COLORS.some((c) => c.name.toLowerCase() === normalized);
}

function createPaletteResult(def: ProjectColorDefinition): ResolvedProjectColor {
  return {
    isHex: false,
    color: def.name,
    hex: def.hex,
    bgClass: def.bg,
    borderClass: `border-${def.name}-500`,
    textClass: def.text,
    style: {},
    bgStyle: {},
    borderStyle: {},
    textStyle: {},
  };
}

function createHexResult(hex: string): ResolvedProjectColor {
  const normalized = normalizeHexColor(hex);
  return {
    isHex: true,
    color: hex,
    hex: normalized,
    bgClass: '',
    borderClass: '',
    textClass: '',
    style: {
      backgroundColor: hex,
      borderColor: hex,
      color: hex,
    },
    bgStyle: {
      backgroundColor: hex,
    },
    borderStyle: {
      borderColor: hex,
    },
    textStyle: {
      color: hex,
    },
  };
}

export function resolveProjectColor(color: string | null | undefined): ResolvedProjectColor {
  const trimmed = color?.trim();
  if (!trimmed) {
    return createPaletteResult(DEFAULT_PROJECT_COLOR_DEF);
  }

  const paletteMatch = PROJECT_COLORS.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (paletteMatch) {
    return createPaletteResult(paletteMatch);
  }

  if (HEX_COLOR_REGEX.test(trimmed)) {
    return createHexResult(trimmed);
  }

  return createPaletteResult(DEFAULT_PROJECT_COLOR_DEF);
}
