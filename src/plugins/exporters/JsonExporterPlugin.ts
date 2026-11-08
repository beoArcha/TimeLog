import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';

export class JsonExporterPlugin implements IExporterPlugin {
  readonly id = 'json-exporter';
  readonly name = 'JSON';
  readonly extension = 'json';
  readonly fileExtension = 'json';
  readonly mimeType = 'application/json;charset=utf-8;';
  readonly iconKey = 'json';

  async export(payload: ExportPayload): Promise<Blob> {
    const jsonContent = JSON.stringify(payload, null, 2);
    return new Blob([jsonContent], { type: this.mimeType });
  }
}
