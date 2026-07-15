// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReportStatsCards from '@features/reports/components/ReportStatsCards';

describe('Unit Tests: ReportStatsCards', () => {
  const mockProps = {
    todaySec: 3600, // 01:00:00
    weekSec: 7200,  // 02:00:00
    monthSec: 10800, // 03:00:00
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
  };

  it('should render correct statistics metrics cards', () => {
    render(<ReportStatsCards {...mockProps} />);
    expect(screen.getByText(/01:00:00/i)).not.toBeNull();
    expect(screen.getByText(/02:00:00/i)).not.toBeNull();
    expect(screen.getByText(/03:00:00/i)).not.toBeNull();
  });
});
