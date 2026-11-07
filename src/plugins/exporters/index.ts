import { PluginRegistry } from '../PluginRegistry';
import { CsvExporterPlugin } from './CsvExporterPlugin';
import { HtmlExporterPlugin } from './HtmlExporterPlugin';
import { JsonExporterPlugin } from './JsonExporterPlugin';
import { MarkdownClipboardExporterPlugin } from './MarkdownClipboardExporterPlugin';
import { OdsExporterPlugin } from './OdsExporterPlugin';
import { XlsxExporterPlugin } from './XlsxExporterPlugin';
import { XmlExporterPlugin } from './XmlExporterPlugin';

export * from './CsvExporterPlugin';
export * from './HtmlExporterPlugin';
export * from './JsonExporterPlugin';
export * from './MarkdownClipboardExporterPlugin';
export * from './OdsExporterPlugin';
export * from './XlsxExporterPlugin';
export * from './XmlExporterPlugin';
export * from './xmlSanitizer';
export * from './zipBuilder';
export * from './reportXmlSchema';

export function registerDefaultExporters(
  registry = PluginRegistry.getInstance()
): void {
  if (!registry.getExporter('csv-exporter')) {
    registry.registerExporter(new CsvExporterPlugin());
  }
  if (!registry.getExporter('html-exporter')) {
    registry.registerExporter(new HtmlExporterPlugin());
  }
  if (!registry.getExporter('json-exporter')) {
    registry.registerExporter(new JsonExporterPlugin());
  }
  if (!registry.getExporter('xml-exporter')) {
    registry.registerExporter(new XmlExporterPlugin());
  }
  if (!registry.getExporter('ods-exporter')) {
    registry.registerExporter(new OdsExporterPlugin());
  }
  if (!registry.getExporter('xlsx-exporter')) {
    registry.registerExporter(new XlsxExporterPlugin());
  }
  if (!registry.getExporter('markdown-exporter')) {
    registry.registerExporter(new MarkdownClipboardExporterPlugin());
  }
}
