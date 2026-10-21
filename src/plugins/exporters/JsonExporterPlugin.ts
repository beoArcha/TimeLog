import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';

export class JsonExporterPlugin implements IExporterPlugin {
  readonly id = 'json-exporter';
  readonly name = 'JSON';
  readonly fileExtension = 'json';
  readonly mimeType = 'application/json;charset=utf-8;';

  async export(payload: ExportPayload): Promise<Blob> {
    const jsonContent = JSON.stringify(payload, null, 2);
    return new Blob([jsonContent], { type: this.mimeType });
  }
}
