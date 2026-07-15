// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReportPeriodSelector from '@features/reports/components/ReportPeriodSelector';

describe('Unit Tests: ReportPeriodSelector', () => {
  const mockProps = {
    reportPeriod: 'today' as const,
    setReportPeriod: vi.fn(),
    reportSort: 'duration' as const,
    setReportSort: vi.fn(),
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
  };

  it('should render period selection options', () => {
    render(<ReportPeriodSelector {...mockProps} />);
    expect(screen.getByText(/Today/i)).not.toBeNull();
    expect(screen.getByText(/Week/i)).not.toBeNull();
  });
});
