import React, { useMemo } from 'react';
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
import { SUPPORTED_LOCALES, LOCALE_METADATA } from '@common/i18n/locales';

export const LanguageSelector: React.FC = () => {
  const { localePref, setLocalePref } = useLocale();
  const { layoutVariant } = useSettings();

  const showExpanded = layoutVariant === 'full';

  const isCustomActive = localePref === 'custom';
  const availableLocales: readonly Locale[] = useMemo(() => {
    return isCustomActive
      ? [...SUPPORTED_LOCALES, 'custom']
      : SUPPORTED_LOCALES;
  }, [isCustomActive]);

  const segmentedOptions: SegmentedControlOption<Locale>[] = useMemo(() => {
    return availableLocales.map((l) => ({
      value: l,
      label: l === 'custom' ? 'CUSTOM' : l,
      testId: `lang-btn-${l}`,
      ariaLabel: LOCALE_METADATA[l]?.nativeName || l,
      title: LOCALE_METADATA[l]?.nativeName || l,
    }));
  }, [availableLocales]);

  return (
    <div
      data-testid="language-selector"
      className="flex items-center p-0.5 rounded-lg border border-border bg-muted/40 transition-all duration-300 text-xs font-sans max-w-full"
    >
      <Languages className="w-3.5 h-3.5 mx-1 sm:mx-1.5 text-muted-foreground shrink-0" aria-hidden="true" />

      <div className={showExpanded ? 'lg:hidden' : 'block'}>
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
          <SelectContent className="max-h-64 overflow-y-auto">
            {availableLocales.map((l) => (
              <SelectItem
                key={l}
                value={l}
                data-testid={`lang-option-${l}`}
                className="text-xs uppercase flex items-center justify-between"
              >
                <span>{l.toUpperCase()}</span>
                {LOCALE_METADATA[l]?.nativeName && (
                  <span className="text-muted-foreground text-2xs ml-2 normal-case">
                    ({LOCALE_METADATA[l].nativeName})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showExpanded && (
        <div className="hidden lg:flex items-center overflow-x-auto max-w-full">
          <SegmentedControl
            value={localePref}
            onChange={setLocalePref}
            options={segmentedOptions}
            size="xs"
            className="border-0 bg-transparent p-0 flex-nowrap"
          />
        </div>
      )}
    </div>
  );
};

