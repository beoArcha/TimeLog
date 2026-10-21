import React from 'react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { SegmentedControl, type SegmentedControlOption } from '@components/SegmentedControl';
import type { LayoutVariant } from '@bindings/LayoutVariant';

const LAYOUT_KEY_MAP = {
  compact: 'SizeSmall',
  medium: 'SizeMedium',
  full: 'SizeLarge',
} as const;

const LAYOUT_SHORT_LABEL_MAP = {
  compact: 'S',
  medium: 'M',
  full: 'L',
} as const;

export const LayoutSelector: React.FC = () => {
  const { locale, customTranslations } = useLocale();
  const { layoutVariant, setLayoutVariant } = useSettings();
  const { showToast } = useWindowShell();

  const options: SegmentedControlOption<LayoutVariant>[] = (['compact', 'medium', 'full'] as const).map(sz => {
    const fullLabel = translate(locale, 'app', LAYOUT_KEY_MAP[sz], customTranslations);
    return {
      value: sz,
      label: (
        <>
          <span className={layoutVariant === 'full' ? 'hidden sm:inline' : 'hidden'}>{fullLabel}</span>
          <span className={layoutVariant === 'full' ? 'sm:hidden' : ''}>{LAYOUT_SHORT_LABEL_MAP[sz]}</span>
        </>
      ),
      title: fullLabel,
      ariaLabel: fullLabel,
      testId: `layout-variant-${sz}`,
    };
  });

  return (
    <SegmentedControl
      value={layoutVariant}
      onChange={(sz) => {
        setLayoutVariant(sz);
        if (showToast) {
          const fullLabel = translate(locale, 'app', LAYOUT_KEY_MAP[sz], customTranslations);
          showToast(`${translate(locale, 'app', 'SizeChanged', customTranslations)} ${fullLabel}`);
        }
      }}
      options={options}
      size="xs"
      className="bg-muted/40 font-sans"
    />
  );
};

