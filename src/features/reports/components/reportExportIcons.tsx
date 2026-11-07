import React from 'react';
import {
  FileSpreadsheet,
  FileCode,
  FileText,
} from 'lucide-react';

export interface FormatIconEntry {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}

export const FORMAT_ICON_CONFIG: Record<string, FormatIconEntry> = {
  csv: { icon: FileSpreadsheet, className: 'text-primary' },
  xlsx: { icon: FileSpreadsheet, className: 'text-primary' },
  ods: { icon: FileSpreadsheet, className: 'text-primary' },
  html: { icon: FileCode, className: 'text-foreground' },
  json: { icon: FileCode, className: 'text-foreground' },
  xml: { icon: FileCode, className: 'text-foreground' },
  markdown: { icon: FileText, className: 'text-muted-foreground' },
};

export const DEFAULT_FORMAT_ICON_CONFIG: FormatIconEntry = {
  icon: FileText,
  className: 'text-muted-foreground',
};

export const getFormatIcon = (
  iconKey?: string,
  isSelected = false
): React.ReactElement => {
  const normalizedKey = (iconKey || '').toLowerCase().trim();
  const config =
    FORMAT_ICON_CONFIG[normalizedKey] || DEFAULT_FORMAT_ICON_CONFIG;
  const IconComponent = config.icon;
  const colorClass = isSelected ? 'text-primary-foreground' : config.className;
  return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
};
