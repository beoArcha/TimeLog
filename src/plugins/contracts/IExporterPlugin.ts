export interface ExportDataRow {
  id: string;
  date: string;
  projectName: string;
  taskName: string;
  subtaskName?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  formattedDuration: string;
  note?: string;
}

export interface ExportSubtaskBreakdown {
  id: string;
  name: string;
  durationSeconds: number;
  formattedDuration: string;
  percentage: number;
}

export interface ExportTaskBreakdown {
  id: string;
  name: string;
  durationSeconds: number;
  formattedDuration: string;
  percentage: number;
  subtasks?: ExportSubtaskBreakdown[];
}

export interface ExportProjectBreakdown {
  id?: string;
  projectName: string;
  seconds: number;
  percentage: number;
  formattedDuration?: string;
  tasks?: ExportTaskBreakdown[];
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

export type ExporterIconKey =
  | 'csv'
  | 'html'
  | 'json'
  | 'xml'
  | 'ods'
  | 'xlsx'
  | 'markdown';

export interface IExporterPlugin {
  readonly id: string;
  readonly name: string;
  readonly extension: string;
  readonly fileExtension: string;
  readonly mimeType: string;
  readonly iconKey: ExporterIconKey | string;
  export(payload: ExportPayload): Promise<Blob | string>;
}

export interface IEventHookPlugin {
  readonly id: string;
  readonly name: string;
  onEvent(eventName: string, payload: unknown): Promise<void>;
}
