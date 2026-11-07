import { describe, it, expect } from 'vitest';
import {
  XmlExporterPlugin,
  isValidXml10CodePoint,
  escapeXml,
} from '@plugins/exporters/XmlExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';

/**
 * Validates an XML document string against the canonical Report XML Schema v1 structural contract.
 */
function validateXmlAgainstReportXsd(xmlString: string): Document {
  expect(xmlString.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();

  // Root validation
  const root = doc.documentElement;
  expect(root.nodeName).toBe('report');
  expect(root.getAttribute('schemaVersion')).toBe('1');

  // Exact 4 canonical sections in strict sequence
  const sectionNames = Array.from(root.children).map((el) => el.nodeName);
  expect(sectionNames).toEqual(['metadata', 'summary', 'projects', 'entries']);

  // Required section assertions
  expect(root.querySelector(':scope > metadata > period')?.textContent).toBeTruthy();
  expect(root.querySelector(':scope > summary > totalSeconds')?.textContent).toMatch(/^\d+$/);

  // Structural checks for projects and entries
  for (const proj of Array.from(root.querySelectorAll(':scope > projects > project'))) {
    expect(proj.querySelector(':scope > name')?.textContent).toBeTruthy();
    expect(proj.querySelector(':scope > durationSeconds')?.textContent).toMatch(/^\d+$/);
    for (const task of Array.from(proj.querySelectorAll(':scope > tasks > task'))) {
      expect(task.querySelector(':scope > name')?.textContent).toBeTruthy();
      for (const sub of Array.from(task.querySelectorAll(':scope > subtasks > subtask'))) {
        expect(sub.querySelector(':scope > name')?.textContent).toBeTruthy();
      }
    }
  }

  for (const entry of Array.from(root.querySelectorAll(':scope > entries > entry'))) {
    expect(entry.querySelector(':scope > id')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > projectName')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > taskName')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > startTime')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > durationSeconds')?.textContent).toMatch(/^\d+$/);
  }

  return doc;
}

function createPayload(overrides: Partial<ExportPayload> = {}): ExportPayload {
  return {
    title: 'Report Title',
    period: 'Current Sprint',
    generatedAt: '2026-11-07T12:00:00Z',
    totalSeconds: 3600,
    formattedTotalDuration: '01h 00m',
    rows: [],
    projectBreakdown: [],
    ...overrides,
  };
}

describe('XmlExporterPlugin & XML / XSD v1 Compliance', () => {
  const exporter = new XmlExporterPlugin();

  describe('Character sanitization and escaping', () => {
    it('validates allowed XML 1.0 code points and rejects invalid control characters', () => {
      expect(isValidXml10CodePoint(0x00)).toBe(false); // NUL
      expect(isValidXml10CodePoint(0x07)).toBe(false); // BEL
      expect(isValidXml10CodePoint(0x08)).toBe(false); // BS
      expect(isValidXml10CodePoint(0x0b)).toBe(false); // VT
      expect(isValidXml10CodePoint(0x0c)).toBe(false); // FF
      expect(isValidXml10CodePoint(0x1f)).toBe(false); // US

      // Allowed whitespace in XML 1.0
      expect(isValidXml10CodePoint(0x09)).toBe(true); // TAB
      expect(isValidXml10CodePoint(0x0a)).toBe(true); // LF
      expect(isValidXml10CodePoint(0x0d)).toBe(true); // CR

      // Unicode diacritics & Emoji
      expect(isValidXml10CodePoint('ą'.codePointAt(0)!)).toBe(true);
      expect(isValidXml10CodePoint('🚀'.codePointAt(0)!)).toBe(true);
    });

    it('escapes predefined XML entities correctly', () => {
      expect(escapeXml('R&D <Fast> "Edition" \'XML\'')).toBe(
        'R&amp;D &lt;Fast&gt; &quot;Edition&quot; &apos;XML&apos;'
      );
      expect(escapeXml(null)).toBe('');
      expect(escapeXml(undefined)).toBe('');
    });
  });

  describe('Report XML Export & XSD Validation Scenarios', () => {
    it('exports a full hierarchy document that complies with XSD v1', async () => {
      const payload = createPayload({
        title: 'Full Hierarchy Sprint Report',
        totalSeconds: 7200,
        formattedTotalDuration: '02h 00m',
        projectBreakdown: [
          {
            id: 'proj-1',
            projectName: 'Platform Core',
            seconds: 7200,
            formattedDuration: '02h 00m',
            percentage: 100,
            tasks: [
              {
                id: 'task-1',
                name: 'Exporters Implementation',
                durationSeconds: 7200,
                formattedDuration: '02h 00m',
                percentage: 100,
                subtasks: [
                  {
                    id: 'sub-1',
                    name: 'XML & XSD Parity',
                    durationSeconds: 4800,
                    formattedDuration: '01h 20m',
                    percentage: 66.7,
                  },
                ],
              },
            ],
          },
        ],
        rows: [
          {
            id: 'entry-1',
            date: '2026-11-07',
            projectName: 'Platform Core',
            taskName: 'Exporters Implementation',
            subtaskName: 'XML & XSD Parity',
            startTime: '2026-11-07T10:00:00Z',
            endTime: '2026-11-07T11:20:00Z',
            durationSeconds: 4800,
            formattedDuration: '01h 20m',
            note: 'Implemented XSD validation suite',
          },
        ],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateXmlAgainstReportXsd(xml);

      expect(doc.querySelector('metadata > title')?.textContent).toBe('Full Hierarchy Sprint Report');
      expect(doc.querySelectorAll('projects > project')).toHaveLength(1);
      expect(doc.querySelectorAll('tasks > task')).toHaveLength(1);
      expect(doc.querySelectorAll('subtasks > subtask')).toHaveLength(1);
      expect(doc.querySelectorAll('entries > entry')).toHaveLength(1);
    });

    it('exports report with missing optional fields matching XSD minOccurs="0"', async () => {
      const payload = createPayload({
        title: 'Minimal Report',
        projectBreakdown: [
          {
            projectName: 'Project No ID',
            seconds: 3600,
            percentage: 100,
            tasks: [
              {
                id: 't-1',
                name: 'Task without subtasks',
                durationSeconds: 3600,
                formattedDuration: '01h 00m',
                percentage: 100,
              },
            ],
          },
        ],
        rows: [
          {
            id: 'entry-min',
            date: '2026-11-07',
            projectName: 'Project No ID',
            taskName: 'Task without subtasks',
            startTime: '2026-11-07T12:00:00Z',
            durationSeconds: 3600,
            formattedDuration: '01h 00m',
          },
        ],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateXmlAgainstReportXsd(xml);

      expect(xml).not.toContain('<subtasks');
      expect(xml).not.toContain('<subtaskName');
      expect(xml).not.toContain('<endTime');
      expect(xml).not.toContain('<note');
      expect(doc.querySelectorAll('entries > entry')).toHaveLength(1);
    });

    it('safely escapes special XML entities and preserves content integrity', async () => {
      const payload = createPayload({
        title: 'Title with & < > " \'',
        projectBreakdown: [
          {
            id: 'p-ent',
            projectName: 'R&D <Lab> "Core" \'Fast\'',
            seconds: 3600,
            percentage: 100,
          },
        ],
        rows: [
          {
            id: 'e-ent',
            date: '2026-11-07',
            projectName: 'R&D <Lab> "Core" \'Fast\'',
            taskName: 'Task & <Test> "Param"',
            startTime: '10:00:00',
            durationSeconds: 3600,
            formattedDuration: '01h 00m',
            note: 'Notes with & < > " \' symbols',
          },
        ],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateXmlAgainstReportXsd(xml);

      expect(xml).toContain('R&amp;D &lt;Lab&gt; &quot;Core&quot; &apos;Fast&apos;');
      expect(doc.querySelector('metadata > title')?.textContent).toBe('Title with & < > " \'');
      expect(doc.querySelector('entries > entry > note')?.textContent).toBe(
        'Notes with & < > " \' symbols'
      );
    });

    it('preserves Unicode, Polish diacritics, and Emoji', async () => {
      const payload = createPayload({
        title: 'Zażółć gęślą jaźń 🚀',
        projectBreakdown: [
          {
            projectName: 'Polski Projekt: ĄĆĘŁŃÓŚŹŻ',
            seconds: 3600,
            percentage: 100,
          },
        ],
        rows: [
          {
            id: 'e-uni',
            date: '2026-11-07',
            projectName: 'Polski Projekt: ĄĆĘŁŃÓŚŹŻ',
            taskName: 'Japoński: 日本語タスク & Ukraiński',
            startTime: '10:00:00',
            durationSeconds: 3600,
            formattedDuration: '01h 00m',
            note: 'Notatka z emoji: 🎉 🔥 i znakami: ąćęłńóśźż',
          },
        ],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateXmlAgainstReportXsd(xml);

      expect(doc.querySelector('metadata > title')?.textContent).toBe('Zażółć gęślą jaźń 🚀');
      expect(doc.querySelector('project > name')?.textContent).toBe('Polski Projekt: ĄĆĘŁŃÓŚŹŻ');
      expect(doc.querySelector('entry > note')?.textContent).toBe(
        'Notatka z emoji: 🎉 🔥 i znakami: ąćęłńóśźż'
      );
    });

    it('sanitizes disallowed control characters without corrupting content', async () => {
      const payload = createPayload({
        title: 'Title\u0000 with\u0007 control\u0008 chars',
        period: 'Period\u001b 2026',
        projectBreakdown: [
          {
            projectName: 'Project\u0000 Clean',
            seconds: 3600,
            percentage: 100,
          },
        ],
        rows: [
          {
            id: 'e-ctrl',
            date: '2026-11-07',
            projectName: 'Project\u0000 Clean',
            taskName: 'Task\u0008 Clean',
            startTime: '10:00:00',
            durationSeconds: 3600,
            formattedDuration: '01h 00m',
            note: 'Note\u0000 with\u001b control\u0008 chars',
          },
        ],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateXmlAgainstReportXsd(xml);

      expect(xml).not.toContain('\u0000');
      expect(xml).not.toContain('\u0007');
      expect(xml).not.toContain('\u0008');
      expect(xml).not.toContain('\u001b');
      expect(doc.querySelector('metadata > title')?.textContent).toBe('Title with control chars');
    });

    it('exports empty report payload with valid self-closing sections', async () => {
      const payload = createPayload({
        title: 'Empty Report',
        totalSeconds: 0,
        formattedTotalDuration: '00m 00s',
        projectBreakdown: [],
        rows: [],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateXmlAgainstReportXsd(xml);

      expect(xml).toContain('<projects/>');
      expect(xml).toContain('<entries/>');
      expect(doc.querySelectorAll('projects > project')).toHaveLength(0);
      expect(doc.querySelectorAll('entries > entry')).toHaveLength(0);
    });

    it('efficiently exports a large report payload with 150 entries complying with XSD', async () => {
      const projects = Array.from({ length: 10 }, (_, pIdx) => ({
        id: `p-${pIdx + 1}`,
        projectName: `Project ${pIdx + 1}`,
        seconds: 3600,
        formattedDuration: '01h 00m',
        percentage: 10,
        tasks: Array.from({ length: 2 }, (_, tIdx) => ({
          id: `t-${pIdx + 1}-${tIdx + 1}`,
          name: `Task ${pIdx + 1}.${tIdx + 1}`,
          durationSeconds: 1800,
          formattedDuration: '30m 00s',
          percentage: 5,
        })),
      }));

      const rows = Array.from({ length: 150 }, (_, eIdx) => ({
        id: `entry-${eIdx + 1}`,
        date: '2026-11-07',
        projectName: `Project ${(eIdx % 10) + 1}`,
        taskName: `Task ${(eIdx % 10) + 1}.1`,
        startTime: '10:00:00',
        endTime: '10:15:00',
        durationSeconds: 900,
        formattedDuration: '15m 00s',
        note: `Log entry #${eIdx + 1} completed`,
      }));

      const payload = createPayload({
        title: 'Large Document Report',
        totalSeconds: 36000,
        formattedTotalDuration: '10h 00m',
        projectBreakdown: projects,
        rows,
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateXmlAgainstReportXsd(xml);

      expect(doc.querySelectorAll('projects > project')).toHaveLength(10);
      expect(doc.querySelectorAll('entries > entry')).toHaveLength(150);
    });
  });
});
