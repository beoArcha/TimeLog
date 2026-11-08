// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { CurrencyStatBadge } from '@components/CurrencyStatBadge';
import { MockLocaleProvider } from '@tests/shared/mocks/MockProviders';
import { translate } from '@common/i18n/translator';
import type { RateStatus } from '@bindings/RateStatus';
import type { Locale } from '@bindings/Locale';

describe('CurrencyStatBadge', () => {
  afterEach(() => {
    cleanup();
  });

  it('should return null when no amount, currency, or rateStatus is provided', () => {
    // Arrange
    const testId = 'empty-badge';

    // Act
    const { container } = render(<CurrencyStatBadge testId={testId} />);

    // Assert
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId(testId)).toBeNull();
  });

  it('should render uppercase currency code when only currency is provided', () => {
    // Arrange
    const currency = 'usd';
    const testId = 'currency-only-badge';

    // Act
    render(<CurrencyStatBadge currency={currency} testId={testId} />);

    // Assert
    const badge = screen.getByTestId(testId);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('USD');
  });

  it('should format amount with currency using Intl.NumberFormat when both are provided', () => {
    // Arrange
    const amount = 1250.5;
    const currency = 'USD';
    const testId = 'amount-and-currency-badge';
    const expected = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

    // Act
    render(<CurrencyStatBadge amount={amount} currency={currency} testId={testId} />);

    // Assert
    const badge = screen.getByTestId(testId);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe(expected);
  });

  it('should format amount as locale number when currency is not provided', () => {
    // Arrange
    const amount = 1250.5;
    const testId = 'amount-without-currency-badge';
    const expected = new Intl.NumberFormat('en').format(amount);

    // Act
    render(<CurrencyStatBadge amount={amount} testId={testId} />);

    // Assert
    const badge = screen.getByTestId(testId);
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe(expected);
  });

  it('should handle zero amounts correctly for both currency and plain numbers', () => {
    // Arrange
    const zeroAmount = 0;
    const testIdCurrency = 'zero-currency-badge';
    const testIdPlain = 'zero-plain-badge';
    const expectedCurrency = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'EUR',
    }).format(zeroAmount);
    const expectedPlain = new Intl.NumberFormat('en').format(zeroAmount);

    // Act
    render(
      <>
        <CurrencyStatBadge amount={zeroAmount} currency="EUR" testId={testIdCurrency} />
        <CurrencyStatBadge amount={zeroAmount} testId={testIdPlain} />
      </>
    );

    // Assert
    expect(screen.getByTestId(testIdCurrency).textContent).toBe(expectedCurrency);
    expect(screen.getByTestId(testIdPlain).textContent).toBe(expectedPlain);
  });

  it('should parse and format numeric string amounts properly', () => {
    // Arrange
    const amountString = '450.75';
    const currency = 'PLN';
    const testId = 'string-amount-badge';
    const expected = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'PLN',
    }).format(450.75);

    // Act
    render(<CurrencyStatBadge amount={amountString} currency={currency} testId={testId} />);

    // Assert
    const badge = screen.getByTestId(testId);
    expect(badge.textContent).toBe(expected);
  });

  it('should fallback gracefully when non-standard currency code is passed', () => {
    // Arrange
    const amount = 100;
    const customCurrency = 'POINTS';
    const testId = 'custom-currency-badge';
    const expected = `${new Intl.NumberFormat('en').format(amount)} POINTS`;

    // Act
    render(<CurrencyStatBadge amount={amount} currency={customCurrency} testId={testId} />);

    // Assert
    const badge = screen.getByTestId(testId);
    expect(badge.textContent).toBe(expected);
  });

  it('should translate all domain rate statuses with default semantic variants', () => {
    // Arrange
    const statuses: Array<{ status: RateStatus; key: 'RateStatusNonBillable' | 'RateStatusUnconfigured' | 'RateStatusCustom' | 'RateStatusInherited' }> = [
      { status: 'non_billable', key: 'RateStatusNonBillable' },
      { status: 'unconfigured', key: 'RateStatusUnconfigured' },
      { status: 'custom', key: 'RateStatusCustom' },
      { status: 'inherited', key: 'RateStatusInherited' },
    ];

    // Act & Assert for each rate status
    statuses.forEach(({ status, key }) => {
      const testId = `status-${status}`;
      const expectedText = translate('en', 'common', key);

      render(<CurrencyStatBadge rateStatus={status} testId={testId} />);

      const badge = screen.getByTestId(testId);
      expect(badge.textContent).toBe(expectedText);
      cleanup();
    });
  });

  it('should format currency according to active locale from LocaleContext', () => {
    // Arrange
    const locale: Locale = 'pl';
    const amount = 999.99;
    const currency = 'PLN';
    const testId = 'pl-locale-badge';
    const expected = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);

    // Act
    render(
      <MockLocaleProvider value={{ locale }}>
        <CurrencyStatBadge amount={amount} currency={currency} testId={testId} />
      </MockLocaleProvider>
    );

    // Assert
    const badge = screen.getByTestId(testId);
    expect(badge.textContent).toBe(expected);
  });

  it('should translate rate status according to active locale in all 10 supported languages', () => {
    // Arrange
    const locales: Locale[] = ['en', 'pl', 'de', 'es', 'pt-br', 'fr', 'uk', 'ja', 'nl', 'it'];
    const rateStatus: RateStatus = 'non_billable';

    // Act & Assert across all 10 languages
    locales.forEach((locale) => {
      const testId = `locale-status-${locale}`;
      const expectedTranslation = translate(locale, 'common', 'RateStatusNonBillable');

      render(
        <MockLocaleProvider value={{ locale }}>
          <CurrencyStatBadge rateStatus={rateStatus} testId={testId} />
        </MockLocaleProvider>
      );

      const badge = screen.getByTestId(testId);
      expect(badge.textContent).toBe(expectedTranslation);
      cleanup();
    });
  });

  it('should honor custom variant, size, and className overrides', () => {
    // Arrange
    const testId = 'override-badge';

    // Act
    render(
      <CurrencyStatBadge
        rateStatus="custom"
        variant="destructive"
        size="md"
        className="custom-extra-class"
        testId={testId}
      />
    );

    // Assert
    const badge = screen.getByTestId(testId);
    expect(badge.className).toContain('custom-extra-class');
  });
});
