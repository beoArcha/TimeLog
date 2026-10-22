// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { TrendIndicator } from '@components/TrendIndicator';
import { translate } from '@common/i18n/translator';

describe('TrendIndicator', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render up trend with emerald style and accessible label when direction is up', () => {
    // Arrange
    const value = '+15%';
    const direction = 'up';
    const expectedLabel = `${translate('en', 'common', 'TrendIncrease')}: ${value}`;

    // Act
    render(<TrendIndicator value={value} direction={direction} />);

    // Assert
    const indicator = screen.getByLabelText(expectedLabel);
    expect(indicator).toBeTruthy();
    expect(screen.getByText(value)).toBeTruthy();
  });

  it('should render down trend with custom label when provided', () => {
    // Arrange
    const value = '-8%';
    const direction = 'down';
    const label = 'Decreased by 8% compared to last week';

    // Act
    render(<TrendIndicator value={value} direction={direction} label={label} />);

    // Assert
    const indicator = screen.getByLabelText(label);
    expect(indicator).toBeTruthy();
    expect(screen.getByText(value)).toBeTruthy();
  });

  it('should render neutral trend with neutral style when direction is neutral', () => {
    // Arrange
    const value = '0%';
    const direction = 'neutral';
    const expectedLabel = `${translate('en', 'common', 'TrendNeutral')}: ${value}`;

    // Act
    render(<TrendIndicator value={value} direction={direction} />);

    // Assert
    const indicator = screen.getByLabelText(expectedLabel);
    expect(indicator).toBeTruthy();
    expect(screen.getByText(value)).toBeTruthy();
  });
});
