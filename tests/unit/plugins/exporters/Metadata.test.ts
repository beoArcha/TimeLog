import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from '@plugins/PluginRegistry';
import {
  registerDefaultExporters,
  CsvExporterPlugin,
  HtmlExporterPlugin,
  JsonExporterPlugin,
  XmlExporterPlugin,
  OdsExporterPlugin,
  XlsxExporterPlugin,
  MarkdownClipboardExporterPlugin,
} from '@plugins/exporters';
import { IExporterPlugin } from '@plugins/contracts/IExporterPlugin';

describe('Exporter Metadata & Registration Alignment (EXP-005)', () => {
  beforeEach(() => {
    PluginRegistry.getInstance().reset();
  });

  const expectedExporters: Array<{
    clazz: new () => IExporterPlugin;
    id: string;
    extension: string;
    mimeTypePrefix: string;
    iconKey: string;
  }> = [
    {
      clazz: CsvExporterPlugin,
      id: 'csv-exporter',
      extension: 'csv',
      mimeTypePrefix: 'text/csv',
      iconKey: 'csv',
    },
    {
      clazz: HtmlExporterPlugin,
      id: 'html-exporter',
      extension: 'html',
      mimeTypePrefix: 'text/html',
      iconKey: 'html',
    },
    {
      clazz: JsonExporterPlugin,
      id: 'json-exporter',
      extension: 'json',
      mimeTypePrefix: 'application/json',
      iconKey: 'json',
    },
    {
      clazz: XmlExporterPlugin,
      id: 'xml-exporter',
      extension: 'xml',
      mimeTypePrefix: 'application/xml',
      iconKey: 'xml',
    },
    {
      clazz: OdsExporterPlugin,
      id: 'ods-exporter',
      extension: 'ods',
      mimeTypePrefix: 'application/vnd.oasis.opendocument.spreadsheet',
      iconKey: 'ods',
    },
    {
      clazz: XlsxExporterPlugin,
      id: 'xlsx-exporter',
      extension: 'xlsx',
      mimeTypePrefix: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      iconKey: 'xlsx',
    },
    {
      clazz: MarkdownClipboardExporterPlugin,
      id: 'markdown-exporter',
      extension: 'md',
      mimeTypePrefix: 'text/markdown',
      iconKey: 'markdown',
    },
  ];

  it.each(expectedExporters)(
    'should define consistent metadata on $id',
    ({ clazz, id, extension, mimeTypePrefix, iconKey }) => {
      const plugin = new clazz();
      expect(plugin.id).toBe(id);
      expect(plugin.name).toBeTruthy();
      expect(typeof plugin.name).toBe('string');
      expect(plugin.extension).toBe(extension);
      expect(plugin.fileExtension).toBe(extension);
      expect(plugin.mimeType.startsWith(mimeTypePrefix)).toBe(true);
      expect(plugin.iconKey).toBe(iconKey);
      expect(typeof plugin.export).toBe('function');
    }
  );

  it('should register all 7 default exporters via registerDefaultExporters idempotently', () => {
    const registry = PluginRegistry.getInstance();
    expect(registry.getExporters()).toHaveLength(0);

    registerDefaultExporters(registry);
    expect(registry.getExporters()).toHaveLength(7);

    // Call again to verify idempotency
    registerDefaultExporters(registry);
    expect(registry.getExporters()).toHaveLength(7);

    for (const exp of expectedExporters) {
      const registered = registry.getExporter(exp.id);
      expect(registered).toBeDefined();
      expect(registered?.iconKey).toBe(exp.iconKey);
    }
  });
});
