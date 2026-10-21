import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportExportModal } from '@features/reports/components/ReportExportModal';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';

describe('ReportExportModal', () => {
  const samplePayload: ExportPayload = {
    title: 'Time Summaries & Reports',
    period: 'week',
    generatedAt: '2026-10-19T12:00:00Z',
    totalSeconds: 3600,
    formattedTotalDuration: '01:00:00',
    rows: [
      {
        id: 'row-1',
        date: '2026-10-19',
        projectName: 'Alpha',
        taskName: 'Task 1',
        startTime: '10:00:00',
        endTime: '11:00:00',
        durationSeconds: 3600,
        formattedDuration: '01:00:00',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render modal with summary preview and format cards when open', () => {
    // Arrange & Act
    render(
      <ReportExportModal
        isOpen={true}
        onClose={vi.fn()}
        payload={samplePayload}
      />
    );

    // Assert
    expect(screen.getByTestId('report-export-modal')).toBeTruthy();
    expect(screen.getByText(/01:00:00/)).toBeTruthy();
    expect(screen.getByTestId('export-format-csv-exporter')).toBeTruthy();
    expect(screen.getByTestId('export-format-json-exporter')).toBeTruthy();
    expect(screen.getByTestId('export-format-markdown-exporter')).toBeTruthy();
  });

  it('should switch selected format to JSON when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ReportExportModal
        isOpen={true}
        onClose={vi.fn()}
        payload={samplePayload}
      />
    );

    // Act
    const jsonBtn = screen.getByTestId('export-format-json-exporter');
    await user.click(jsonBtn);

    // Assert
    expect(within(jsonBtn).getByText('Active')).toBeTruthy();
  });

  it('should trigger file download when Download button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const createObjectURLMock = vi.fn().mockReturnValue('blob:test-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    render(
      <ReportExportModal
        isOpen={true}
        onClose={vi.fn()}
        payload={samplePayload}
      />
    );

    // Act
    const downloadBtn = screen.getByTestId('export-download-button');
    await user.click(downloadBtn);

    // Assert
    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled();
    });
  });

  it('should display Copy to Clipboard button when Markdown format is active and copy to clipboard', async () => {
    // Arrange
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    render(
      <ReportExportModal
        isOpen={true}
        onClose={vi.fn()}
        payload={samplePayload}
      />
    );

    // Act - select markdown format
    const mdBtn = screen.getByTestId('export-format-markdown-exporter');
    await user.click(mdBtn);

    // Assert copy button appears
    const copyBtn = screen.getByTestId('export-copy-button');
    expect(copyBtn).toBeTruthy();

    // Act - copy to clipboard
    await user.click(copyBtn);

    // Assert
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });

  it('should call onClose when cancel button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const onCloseMock = vi.fn();
    render(
      <ReportExportModal
        isOpen={true}
        onClose={onCloseMock}
        payload={samplePayload}
      />
    );

    // Act
    const closeBtn = screen.getByTestId('export-cancel-button');
    await user.click(closeBtn);

    // Assert
    expect(onCloseMock).toHaveBeenCalled();
  });
});
