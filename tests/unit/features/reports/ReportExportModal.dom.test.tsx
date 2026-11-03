// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReportExportModal } from '@features/reports/components/ReportExportModal';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';
import { expectNoFlowContent } from '@tests/shared/html-content-model';
import type { ExportPayload } from '@plugins/contracts/IExporterPlugin';

describe('ReportExportModal DOM content model', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPayload: ExportPayload = {
    title: 'TimeLog Export Report',
    period: '2026-11-01',
    generatedAt: '2026-11-02T12:00:00Z',
    totalSeconds: 3600,
    formattedTotalDuration: '01:00:00',
    rows: [],
  };

  it('ensures format option buttons contain only phrasing content in rendered DOM', () => {
    const mockState = {
      ...getMockOxyFlowState(),
      locale: 'en',
      customTranslations: {},
    };

    render(
      <MockProviders state={mockState}>
        <ReportExportModal
          isOpen={true}
          onClose={vi.fn()}
          payload={mockPayload}
        />
      </MockProviders>
    );

    const formatButtons = document.querySelectorAll('[data-testid^="export-format-"]');
    expect(formatButtons.length).toBeGreaterThan(0);

    formatButtons.forEach((btn) => {
      expectNoFlowContent(btn);
    });
  });
});
