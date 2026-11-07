import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';
import {
  isValidXml10CodePoint,
  sanitizeXml10,
  escapeXml,
} from './xmlSanitizer';

export { isValidXml10CodePoint, sanitizeXml10, escapeXml };

/**
 * Creates a leaf XML element: `<tagName>escapedValue</tagName>`.
 * Returns an empty string if value is null or undefined.
 */
export function createXmlElement(tagName: string, value: unknown, indent = 0): string {
  if (value === null || value === undefined) return '';
  const spaces = ' '.repeat(indent);
  return `${spaces}<${tagName}>${escapeXml(value)}</${tagName}>`;
}

/**
 * Creates a container XML block with optional attributes and nested children.
 * Renders self-closing `<tagName .../>` when children are empty.
 */
export function createXmlBlock(
  tagName: string,
  children: string[],
  indent = 0,
  attributes?: Record<string, string>
): string {
  const spaces = ' '.repeat(indent);
  const attrStr = attributes
    ? ' ' + Object.entries(attributes).map(([k, v]) => `${k}="${escapeXml(v)}"`).join(' ')
    : '';

  const validChildren = children.filter((c) => c && c.trim().length > 0);
  if (validChildren.length === 0) {
    return `${spaces}<${tagName}${attrStr}/>`;
  }

  return [
    `${spaces}<${tagName}${attrStr}>`,
    ...validChildren,
    `${spaces}</${tagName}>`,
  ].join('\n');
}

export class XmlExporterPlugin implements IExporterPlugin {
  readonly id = 'xml-exporter';
  readonly name = 'XML';
  readonly extension = 'xml';
  readonly fileExtension = 'xml';
  readonly mimeType = 'application/xml;charset=utf-8;';
  readonly iconKey = 'xml';

  async export(payload: ExportPayload): Promise<Blob> {
    const metadata = createXmlBlock(
      'metadata',
      [
        createXmlElement('title', payload.title, 4),
        createXmlElement('period', payload.period, 4),
        createXmlElement('generatedAt', payload.generatedAt, 4),
      ],
      2
    );

    const summary = createXmlBlock(
      'summary',
      [
        createXmlElement('totalSeconds', payload.totalSeconds, 4),
        createXmlElement('formattedTotalDuration', payload.formattedTotalDuration, 4),
      ],
      2
    );

    const projectBlocks = (payload.projectBreakdown ?? []).map((project) => {
      const taskBlocks = (project.tasks ?? []).map((task) => {
        const subtaskBlocks = (task.subtasks ?? []).map((subtask) =>
          createXmlBlock(
            'subtask',
            [
              createXmlElement('id', subtask.id, 10),
              createXmlElement('name', subtask.name, 10),
              createXmlElement('durationSeconds', subtask.durationSeconds, 10),
              createXmlElement('formattedDuration', subtask.formattedDuration, 10),
              createXmlElement('percentage', subtask.percentage, 10),
            ],
            8
          )
        );

        const subtasksXml =
          subtaskBlocks.length > 0 ? createXmlBlock('subtasks', subtaskBlocks, 8) : '';

        return createXmlBlock(
          'task',
          [
            createXmlElement('id', task.id, 8),
            createXmlElement('name', task.name, 8),
            createXmlElement('durationSeconds', task.durationSeconds, 8),
            createXmlElement('formattedDuration', task.formattedDuration, 8),
            createXmlElement('percentage', task.percentage, 8),
            ...(subtasksXml ? [subtasksXml] : []),
          ],
          6
        );
      });

      const tasksXml = taskBlocks.length > 0 ? createXmlBlock('tasks', taskBlocks, 6) : '';

      return createXmlBlock(
        'project',
        [
          ...(project.id ? [createXmlElement('id', project.id, 6)] : []),
          createXmlElement('name', project.projectName, 6),
          createXmlElement('durationSeconds', project.seconds, 6),
          ...(project.formattedDuration
            ? [createXmlElement('formattedDuration', project.formattedDuration, 6)]
            : []),
          createXmlElement('percentage', project.percentage, 6),
          ...(tasksXml ? [tasksXml] : []),
        ],
        4
      );
    });
    const projects = createXmlBlock('projects', projectBlocks, 2);

    const entryBlocks = (payload.rows ?? []).map((row) =>
      createXmlBlock(
        'entry',
        [
          createXmlElement('id', row.id, 6),
          createXmlElement('date', row.date, 6),
          createXmlElement('projectName', row.projectName, 6),
          createXmlElement('taskName', row.taskName, 6),
          ...(row.subtaskName ? [createXmlElement('subtaskName', row.subtaskName, 6)] : []),
          createXmlElement('startTime', row.startTime, 6),
          ...(row.endTime ? [createXmlElement('endTime', row.endTime, 6)] : []),
          createXmlElement('durationSeconds', row.durationSeconds, 6),
          createXmlElement('formattedDuration', row.formattedDuration, 6),
          ...(row.note ? [createXmlElement('note', row.note, 6)] : []),
        ],
        4
      )
    );
    const entries = createXmlBlock('entries', entryBlocks, 2);

    const report = createXmlBlock(
      'report',
      [metadata, summary, projects, entries],
      0,
      { schemaVersion: '1' }
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${report}\n`;
    return new Blob([xml], { type: this.mimeType });
  }
}
