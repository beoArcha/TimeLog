import React from 'react';
import { Languages } from 'lucide-react';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import type { Locale } from '@bindings/Locale';
import { SegmentedControl, type SegmentedControlOption } from '@components/SegmentedControl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';

const SUPPORTED_LOCALES = ['pl', 'en', 'de', 'es', 'pt-br', 'fr', 'uk', 'system'] as const;

export const LanguageSelector: React.FC = () => {
  const { localePref, setLocalePref } = useLocale();
  const { layoutVariant } = useSettings();

  const showExpanded = layoutVariant === 'full';

  const options: SegmentedControlOption<Locale>[] = SUPPORTED_LOCALES.map(l => ({
    value: l as Locale,
    label: l,
    testId: `lang-btn-${l}`,
    ariaLabel: l,
  }));

  return (
    <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/40 transition-all duration-300 text-xs font-sans">
      <Languages className="w-3.5 h-3.5 mx-1 sm:mx-1.5 text-muted-foreground shrink-0" />

      <div className={showExpanded ? 'lg:hidden' : ''}>
        <Select
          value={localePref}
          onValueChange={(val) => {
            if (val) setLocalePref(val as Locale);
          }}
        >
          <SelectTrigger
            data-testid="lang-select-trigger"
            className="h-6 border-0 bg-transparent px-1.5 py-0.5 font-bold uppercase shadow-none focus-visible:ring-1"
            aria-label="Language selection"
          >
            <SelectValue>{localePref.toUpperCase()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LOCALES.map(l => (
              <SelectItem key={l} value={l} data-testid={`lang-option-${l}`} className="text-xs uppercase">
                {l.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showExpanded && (
        <div className="hidden lg:flex items-center">
          <SegmentedControl
            value={localePref as Locale}
            onChange={setLocalePref}
            options={options}
            size="xs"
            className="border-0 bg-transparent p-0"
          />
        </div>
      )}
    </div>
  );
};

