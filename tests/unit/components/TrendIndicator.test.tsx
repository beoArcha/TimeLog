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

  it('should render accessible role img and label when direction is up', () => {
    // Arrange
    const value = '+15%';
    const direction = 'up';
    const expectedLabel = `${translate('en', 'common', 'TrendIncrease')}: ${value}`;

    // Act
    render(<TrendIndicator value={value} direction={direction} testId="trend-up" />);

    // Assert
    const indicator = screen.getByRole('img', { name: expectedLabel });
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('data-direction')).toBe('up');
    expect(indicator.getAttribute('data-sentiment')).toBe('positive');
    expect(screen.getByTestId('trend-up-icon-up')).toBeTruthy();
    expect(screen.getByText(value)).toBeTruthy();
  });

  it('should render down trend with custom label when provided', () => {
    // Arrange
    const value = '-8%';
    const direction = 'down';
    const label = 'Decreased by 8% compared to last week';

    // Act
    render(<TrendIndicator value={value} direction={direction} label={label} testId="trend-down" />);

    // Assert
    const indicator = screen.getByRole('img', { name: label });
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('data-direction')).toBe('down');
    expect(indicator.getAttribute('data-sentiment')).toBe('negative');
    expect(screen.getByTestId('trend-down-icon-down')).toBeTruthy();
    expect(screen.getByText(value)).toBeTruthy();
  });

  it('should render neutral trend with neutral style when direction is neutral', () => {
    // Arrange
    const value = '0%';
    const direction = 'neutral';
    const expectedLabel = `${translate('en', 'common', 'TrendNeutral')}: ${value}`;

    // Act
    render(<TrendIndicator value={value} direction={direction} testId="trend-neutral" />);

    // Assert
    const indicator = screen.getByRole('img', { name: expectedLabel });
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('data-direction')).toBe('neutral');
    expect(indicator.getAttribute('data-sentiment')).toBe('neutral');
    expect(screen.getByTestId('trend-neutral-icon-neutral')).toBeTruthy();
    expect(screen.getByText(value)).toBeTruthy();
  });

  it('should default to neutral direction and neutral sentiment when props are omitted', () => {
    // Arrange
    const value = '0h';
    const expectedLabel = `${translate('en', 'common', 'TrendNeutral')}: ${value}`;

    // Act
    render(<TrendIndicator value={value} testId="trend-default" />);

    // Assert
    const indicator = screen.getByRole('img', { name: expectedLabel });
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('data-direction')).toBe('neutral');
    expect(indicator.getAttribute('data-sentiment')).toBe('neutral');
    expect(screen.getByTestId('trend-default-icon-neutral')).toBeTruthy();
  });

  it('should decouple sentiment from direction when sentiment is negative and direction is up', () => {
    // Arrange
    const value = '+35%';
    const direction = 'up';
    const sentiment = 'negative';
    const expectedLabel = `${translate('en', 'common', 'TrendIncrease')}: ${value}`;

    // Act
    render(
      <TrendIndicator
        value={value}
        direction={direction}
        sentiment={sentiment}
        testId="cost-trend"
      />
    );

    // Assert
    const indicator = screen.getByRole('img', { name: expectedLabel });
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('data-direction')).toBe('up');
    expect(indicator.getAttribute('data-sentiment')).toBe('negative');
    expect(screen.getByTestId('cost-trend-icon-up')).toBeTruthy();
    expect(screen.getByText(value)).toBeTruthy();
  });

  it('should decouple sentiment from direction when sentiment is positive and direction is down', () => {
    // Arrange
    const value = '-50%';
    const direction = 'down';
    const sentiment = 'positive';
    const expectedLabel = `${translate('en', 'common', 'TrendDecrease')}: ${value}`;

    // Act
    render(
      <TrendIndicator
        value={value}
        direction={direction}
        sentiment={sentiment}
        testId="defect-trend"
      />
    );

    // Assert
    const indicator = screen.getByRole('img', { name: expectedLabel });
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('data-direction')).toBe('down');
    expect(indicator.getAttribute('data-sentiment')).toBe('positive');
    expect(screen.getByTestId('defect-trend-icon-down')).toBeTruthy();
    expect(screen.getByText(value)).toBeTruthy();
  });

  it('should apply explicit neutral sentiment when provided for directional trend', () => {
    // Arrange
    const value = '+2%';
    const direction = 'up';
    const sentiment = 'neutral';
    const expectedLabel = `${translate('en', 'common', 'TrendIncrease')}: ${value}`;

    // Act
    render(
      <TrendIndicator
        value={value}
        direction={direction}
        sentiment={sentiment}
        testId="minor-trend"
      />
    );

    // Assert
    const indicator = screen.getByRole('img', { name: expectedLabel });
    expect(indicator).toBeTruthy();
    expect(indicator.getAttribute('data-direction')).toBe('up');
    expect(indicator.getAttribute('data-sentiment')).toBe('neutral');
    expect(screen.getByTestId('minor-trend-icon-up')).toBeTruthy();
  });
});
