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
import { translate } from '@common/i18n/translator';

export const LanguageSelector: React.FC = () => {
  const { localePref, setLocalePref, locale, customTranslations } = useLocale();
  const { layoutVariant } = useSettings();

  const showExpanded = layoutVariant === 'full';

  const isCustomActive = localePref === 'custom';
  const availableLocales: readonly Locale[] = useMemo(() => {
    return isCustomActive
      ? [...SUPPORTED_LOCALES, 'custom']
      : SUPPORTED_LOCALES;
  }, [isCustomActive]);

  const getLocaleLabel = (code: Locale): string => {
    if (code === 'system') {
      return translate(locale, 'settings', 'SystemDefault', customTranslations);
    }
    if (code === 'custom') {
      return translate(locale, 'settings', 'CustomLanguageTitle', customTranslations);
    }
    return LOCALE_METADATA[code]?.nativeName || code;
  };

  const segmentedOptions: SegmentedControlOption<Locale>[] = availableLocales.map((l) => ({
    value: l,
    label: l === 'custom' ? getLocaleLabel(l) : l,
    testId: `lang-btn-${l}`,
    ariaLabel: getLocaleLabel(l),
    title: getLocaleLabel(l),
  }));

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
            aria-label={translate(locale, 'settings', 'LanguageSelectionAria', customTranslations)}
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
                {getLocaleLabel(l) && (
                  <span className="text-muted-foreground text-2xs ml-2 normal-case">
                    ({getLocaleLabel(l)})
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

export default LanguageSelector;
