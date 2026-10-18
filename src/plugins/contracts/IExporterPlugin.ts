export interface ExportDataRow {
  id: string;
  date: string;
  projectName: string;
  taskName: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  formattedDuration: string;
  note?: string;
}

export interface ExportProjectBreakdown {
  projectName: string;
  seconds: number;
  percentage: number;
}

export interface ExportPayload {
  title: string;
  period: string;
  generatedAt: string;
  totalSeconds: number;
  formattedTotalDuration: string;
  rows: ExportDataRow[];
  projectBreakdown?: ExportProjectBreakdown[];
}

export interface IExporterPlugin {
  readonly id: string;
  readonly name: string;
  readonly fileExtension: string;
  readonly mimeType: string;
  export(payload: ExportPayload): Promise<Blob | string>;
}

export interface IEventHookPlugin {
  readonly id: string;
  readonly name: string;
  onEvent(eventName: string, payload: unknown): Promise<void>;
}
