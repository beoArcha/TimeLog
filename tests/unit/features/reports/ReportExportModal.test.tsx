import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportExportModal } from '@features/reports/components/ReportExportModal';
import {
  getFormatIcon,
  DEFAULT_FORMAT_ICON_CONFIG,
} from '@features/reports/components/reportExportIcons';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';
import { PluginRegistry } from '@plugins/PluginRegistry';

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
    expect(screen.getByTestId('export-format-html-exporter')).toBeTruthy();
    expect(screen.getByTestId('export-format-json-exporter')).toBeTruthy();
    expect(screen.getByTestId('export-format-xml-exporter')).toBeTruthy();
    expect(screen.getByTestId('export-format-ods-exporter')).toBeTruthy();
    expect(screen.getByTestId('export-format-xlsx-exporter')).toBeTruthy();
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

  it('should switch format to XLSX and trigger download with .xlsx extension', async () => {
    // Arrange
    const user = userEvent.setup();
    const createObjectURLMock = vi.fn().mockReturnValue('blob:test-xlsx-url');
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
    const xlsxBtn = screen.getByTestId('export-format-xlsx-exporter');
    await user.click(xlsxBtn);
    expect(within(xlsxBtn).getByText('Active')).toBeTruthy();

    const downloadBtn = screen.getByTestId('export-download-button');
    await user.click(downloadBtn);

    // Assert
    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalled();
    });
  });

  it('should switch format to ODS and HTML correctly', async () => {
    const user = userEvent.setup();
    render(
      <ReportExportModal
        isOpen={true}
        onClose={vi.fn()}
        payload={samplePayload}
      />
    );

    const odsBtn = screen.getByTestId('export-format-ods-exporter');
    await user.click(odsBtn);
    expect(within(odsBtn).getByText('Active')).toBeTruthy();

    const htmlBtn = screen.getByTestId('export-format-html-exporter');
    await user.click(htmlBtn);
    expect(within(htmlBtn).getByText('Active')).toBeTruthy();
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

  describe('OCP and declarative icon mapping', () => {
    it('maps known iconKey values to corresponding icons and semantic theme tokens', () => {
      const csvIcon = getFormatIcon('csv', false);
      const xlsxIcon = getFormatIcon('xlsx', false);
      const odsIcon = getFormatIcon('ods', false);
      const htmlIcon = getFormatIcon('html', false);
      const jsonIcon = getFormatIcon('json', false);
      const xmlIcon = getFormatIcon('xml', false);
      const mdIcon = getFormatIcon('markdown', false);

      expect(csvIcon.props.className).toContain('text-primary');
      expect(xlsxIcon.props.className).toContain('text-primary');
      expect(odsIcon.props.className).toContain('text-primary');
      expect(htmlIcon.props.className).toContain('text-foreground');
      expect(jsonIcon.props.className).toContain('text-foreground');
      expect(xmlIcon.props.className).toContain('text-foreground');
      expect(mdIcon.props.className).toContain('text-muted-foreground');

      // None of the icons should use legacy hardcoded color classes
      const legacyColorRegex = /text-(emerald|green|teal|orange|amber|purple|sky)-[0-9]{3}/;
      expect(legacyColorRegex.test(csvIcon.props.className)).toBe(false);
      expect(legacyColorRegex.test(xlsxIcon.props.className)).toBe(false);
      expect(legacyColorRegex.test(odsIcon.props.className)).toBe(false);
      expect(legacyColorRegex.test(htmlIcon.props.className)).toBe(false);
      expect(legacyColorRegex.test(jsonIcon.props.className)).toBe(false);
      expect(legacyColorRegex.test(xmlIcon.props.className)).toBe(false);
      expect(legacyColorRegex.test(mdIcon.props.className)).toBe(false);
    });

    it('uses text-primary-foreground when an icon is selected', () => {
      const selectedIcon = getFormatIcon('csv', true);
      expect(selectedIcon.props.className).toContain('text-primary-foreground');
    });

    it('safely falls back to DEFAULT_FORMAT_ICON_CONFIG for unknown or missing iconKey', () => {
      const unknownIcon = getFormatIcon('unknown-ext', false);
      const emptyIcon = getFormatIcon('', false);
      const undefinedIcon = getFormatIcon(undefined, false);

      expect(unknownIcon.type).toBe(DEFAULT_FORMAT_ICON_CONFIG.icon);
      expect(unknownIcon.props.className).toContain('text-muted-foreground');

      expect(emptyIcon.type).toBe(DEFAULT_FORMAT_ICON_CONFIG.icon);
      expect(emptyIcon.props.className).toContain('text-muted-foreground');

      expect(undefinedIcon.type).toBe(DEFAULT_FORMAT_ICON_CONFIG.icon);
      expect(undefinedIcon.props.className).toContain('text-muted-foreground');
    });

    it('renders newly registered exporter with unknown iconKey using safe fallback without modifying modal code (OCP)', () => {
      const customExporter = {
        id: 'custom-ocp-exporter',
        name: 'Custom Format (OCP)',
        extension: 'cst',
        fileExtension: 'cst',
        mimeType: 'application/octet-stream',
        iconKey: 'custom-non-standard-key',
        export: vi.fn().mockResolvedValue(new Blob(['test'])),
      };

      PluginRegistry.getInstance().registerExporter(customExporter);

      try {
        render(
          <ReportExportModal
            isOpen={true}
            onClose={vi.fn()}
            payload={samplePayload}
          />
        );

        const customBtn = screen.getByTestId('export-format-custom-ocp-exporter');
        expect(customBtn).toBeTruthy();
        expect(within(customBtn).getByText('Custom Format (OCP)')).toBeTruthy();
        expect(within(customBtn).getByText('.cst')).toBeTruthy();

        // Verify that the button contains an SVG icon with semantic styling
        const svg = customBtn.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg?.getAttribute('class')).toContain('text-muted-foreground');
        expect(svg?.getAttribute('class')).not.toContain('text-emerald-500');
      } finally {
        PluginRegistry.getInstance().unregisterExporter('custom-ocp-exporter');
      }
    });
  });
});
