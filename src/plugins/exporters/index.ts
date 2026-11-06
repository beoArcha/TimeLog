import { PluginRegistry } from '../PluginRegistry';
import { CsvExporterPlugin } from './CsvExporterPlugin';
import { JsonExporterPlugin } from './JsonExporterPlugin';
import { MarkdownClipboardExporterPlugin } from './MarkdownClipboardExporterPlugin';
import { XmlExporterPlugin } from './XmlExporterPlugin';

export * from './CsvExporterPlugin';
export * from './JsonExporterPlugin';
export * from './MarkdownClipboardExporterPlugin';
export * from './XmlExporterPlugin';

export function registerDefaultExporters(registry = PluginRegistry.getInstance()): void {
  if (!registry.getExporter('csv-exporter')) {
    registry.registerExporter(new CsvExporterPlugin());
  }
  if (!registry.getExporter('json-exporter')) {
    registry.registerExporter(new JsonExporterPlugin());
  }
  if (!registry.getExporter('xml-exporter')) {
    registry.registerExporter(new XmlExporterPlugin());
  }
  if (!registry.getExporter('markdown-exporter')) {
    registry.registerExporter(new MarkdownClipboardExporterPlugin());
  }
}
