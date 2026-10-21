import React from 'react';
import { useSettings } from '@common/hooks/SettingsContext';
import { SegmentedControl, type SegmentedControlOption } from '@components/SegmentedControl';
import type { TextAndIconSize } from '@bindings/TextAndIconSize';

const TEXT_SIZE_CLASS_MAP = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
} as const;

export const TextScaleSelector: React.FC = () => {
  const { textAndIconSize, setTextAndIconSize } = useSettings();

  const options: SegmentedControlOption<TextAndIconSize>[] = (['small', 'medium', 'large'] as const).map(scale => ({
    value: scale,
    label: <span className={`font-serif leading-none font-bold ${TEXT_SIZE_CLASS_MAP[scale]}`}>A</span>,
    testId: `text-scale-${scale}`,
    ariaLabel: scale,
    className: 'min-w-[26px] px-1.5',
  }));

  return (
    <SegmentedControl
      value={textAndIconSize}
      onChange={setTextAndIconSize}
      options={options}
      size="xs"
      className="bg-muted/40 font-sans"
    />
  );
};

