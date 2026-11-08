import { describe, it, expect } from 'vitest';
import { XmlExporterPlugin } from '@plugins/exporters/XmlExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';
import {
  REPORT_XML_SCHEMA_V1,
  getReportXmlSchema,
} from '@plugins/exporters/reportXmlSchema';

/**
 * Asserts that the child elements of a given parent node appear in the strict
 * sequence defined by the expected order slice.
 */
function assertChildSequence(parent: Element, expectedOrder: readonly string[]): void {
  const actualChildren = Array.from(parent.children).map((c) => c.nodeName);
  let lastIndex = -1;

  for (const childName of actualChildren) {
    const expectedIndex = expectedOrder.indexOf(childName);
    expect(
      expectedIndex,
      `Unexpected child element <${childName}> inside <${parent.nodeName}>. Expected one of: ${expectedOrder.join(', ')}`
    ).toBeGreaterThan(-1);
    expect(
      expectedIndex,
      `Element <${childName}> in <${parent.nodeName}> is out of sequence. Children: ${actualChildren.join(' -> ')}`
    ).toBeGreaterThan(lastIndex);
    lastIndex = expectedIndex;
  }
}

/**
 * Validates an XML string against all structural and data-type constraints
 * defined in schemas/xml/report/v1/report.xsd.
 */
export function validateReportXmlAgainstXsd(xmlString: string): Document {
  expect(xmlString.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  expect(parserError, `XML parsing failed: ${parserError?.textContent ?? ''}`).toBeNull();

  // Root <report> element validation
  const root = doc.documentElement;
  expect(root.nodeName).toBe('report');
  expect(root.getAttribute('schemaVersion')).toBe('1');

  // Exact 4 canonical sections in strict sequence
  const sectionNames = Array.from(root.children).map((el) => el.nodeName);
  expect(sectionNames).toEqual(['metadata', 'summary', 'projects', 'entries']);

  // Section 1: <metadata>
  const metadataEl = root.children[0];
  assertChildSequence(metadataEl, ['title', 'period', 'generatedAt'] as const);
  const periodText = metadataEl.querySelector(':scope > period')?.textContent;
  expect(periodText).toBeTruthy();

  const generatedAtText = metadataEl.querySelector(':scope > generatedAt')?.textContent;
  if (generatedAtText) {
    const isoDateTimeRegex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
    expect(
      isoDateTimeRegex.test(generatedAtText),
      `generatedAt '${generatedAtText}' does not match xs:dateTime ISO 8601 format`
    ).toBe(true);
  }

  // Section 2: <summary>
  const summaryEl = root.children[1];
  assertChildSequence(summaryEl, ['totalSeconds', 'formattedTotalDuration'] as const);
  const totalSecondsText = summaryEl.querySelector(':scope > totalSeconds')?.textContent;
  expect(totalSecondsText).toMatch(/^\d+$/);
  expect(summaryEl.querySelector(':scope > formattedTotalDuration')?.textContent).toBeDefined();

  // Section 3: <projects>
  const projectsEl = root.children[2];
  for (const proj of Array.from(projectsEl.children)) {
    expect(proj.nodeName).toBe('project');
    assertChildSequence(proj, [
      'id',
      'name',
      'durationSeconds',
      'formattedDuration',
      'percentage',
      'tasks',
    ] as const);

    expect(proj.querySelector(':scope > name')?.textContent).toBeTruthy();
    expect(proj.querySelector(':scope > durationSeconds')?.textContent).toMatch(/^\d+$/);
    expect(proj.querySelector(':scope > percentage')?.textContent).toMatch(/^-?\d+(\.\d+)?$/);

    const tasksContainer = proj.querySelector(':scope > tasks');
    if (tasksContainer) {
      for (const task of Array.from(tasksContainer.children)) {
        expect(task.nodeName).toBe('task');
        assertChildSequence(task, [
          'id',
          'name',
          'durationSeconds',
          'formattedDuration',
          'percentage',
          'subtasks',
        ] as const);

        expect(task.querySelector(':scope > id')?.textContent).toBeTruthy();
        expect(task.querySelector(':scope > name')?.textContent).toBeTruthy();
        expect(task.querySelector(':scope > durationSeconds')?.textContent).toMatch(/^\d+$/);
        expect(task.querySelector(':scope > formattedDuration')?.textContent).toBeDefined();
        expect(task.querySelector(':scope > percentage')?.textContent).toMatch(/^-?\d+(\.\d+)?$/);

        const subtasksContainer = task.querySelector(':scope > subtasks');
        if (subtasksContainer) {
          for (const sub of Array.from(subtasksContainer.children)) {
            expect(sub.nodeName).toBe('subtask');
            assertChildSequence(sub, [
              'id',
              'name',
              'durationSeconds',
              'formattedDuration',
              'percentage',
            ] as const);

            expect(sub.querySelector(':scope > id')?.textContent).toBeTruthy();
            expect(sub.querySelector(':scope > name')?.textContent).toBeTruthy();
            expect(sub.querySelector(':scope > durationSeconds')?.textContent).toMatch(/^\d+$/);
            expect(sub.querySelector(':scope > formattedDuration')?.textContent).toBeDefined();
            expect(sub.querySelector(':scope > percentage')?.textContent).toMatch(/^-?\d+(\.\d+)?$/);
          }
        }
      }
    }
  }

  // Section 4: <entries>
  const entriesEl = root.children[3];
  for (const entry of Array.from(entriesEl.children)) {
    expect(entry.nodeName).toBe('entry');
    assertChildSequence(entry, [
      'id',
      'date',
      'projectName',
      'taskName',
      'subtaskName',
      'startTime',
      'endTime',
      'durationSeconds',
      'formattedDuration',
      'note',
    ] as const);

    expect(entry.querySelector(':scope > id')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > date')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > projectName')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > taskName')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > startTime')?.textContent).toBeTruthy();
    expect(entry.querySelector(':scope > durationSeconds')?.textContent).toMatch(/^\d+$/);
    expect(entry.querySelector(':scope > formattedDuration')?.textContent).toBeDefined();
  }

  return doc;
}

/**
 * Checks whether an XML string conforms to the canonical report schema rules,
 * returning validation status and diagnostic error without throwing.
 */
function inspectXmlSchemaConformance(xmlString: string): { isValid: boolean; error?: string } {
  try {
    validateReportXmlAgainstXsd(xmlString);
    return { isValid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { isValid: false, error: message };
  }
}

function createReportPayload(overrides: Partial<ExportPayload> = {}): ExportPayload {
  return {
    title: 'Sprint Performance Report',
    period: '2026-W45',
    generatedAt: '2026-11-08T10:30:00Z',
    totalSeconds: 7200,
    formattedTotalDuration: '02h 00m',
    rows: [],
    projectBreakdown: [],
    ...overrides,
  };
}

describe('XmlReportXsdValidation - Cross-Runtime Canonical XML XSD Schema Suite', () => {
  const exporter = new XmlExporterPlugin();

  describe('Canonical Schema Integrity & Declarations', () => {
    it('verifies that the loaded report.xsd defines all canonical types and fixed attributes', () => {
      const schema = getReportXmlSchema('1');
      expect(schema).toBe(REPORT_XML_SCHEMA_V1);
      expect(schema).toContain('<xs:element name="report">');
      expect(schema).toContain('name="schemaVersion" type="xs:string" use="required" fixed="1"');
      expect(schema).toContain('<xs:complexType name="MetadataType">');
      expect(schema).toContain('<xs:complexType name="SummaryType">');
      expect(schema).toContain('<xs:complexType name="ProjectType">');
      expect(schema).toContain('<xs:complexType name="TaskType">');
      expect(schema).toContain('<xs:complexType name="SubtaskType">');
      expect(schema).toContain('<xs:complexType name="EntryType">');
      expect(schema).toContain('type="xs:nonNegativeInteger"');
      expect(schema).toContain('type="xs:decimal"');
      expect(schema).toContain('type="xs:dateTime"');
    });
  });

  describe('Scenario 1: Full Hierarchy (Project -> Task -> Subtask + Entries)', () => {
    it('generates fully populated report complying with XSD sequence and data types', async () => {
      const payload = createReportPayload({
        title: 'Full Hierarchy Architecture Audit',
        period: 'Q4 2026',
        generatedAt: '2026-11-08T12:00:00.000Z',
        totalSeconds: 10800,
        formattedTotalDuration: '03h 00m',
        projectBreakdown: [
          {
            id: 'proj-alpha',
            projectName: 'Platform Core',
            seconds: 10800,
            formattedDuration: '03h 00m',
            percentage: 100.0,
            tasks: [
              {
                id: 'task-auth',
                name: 'Authentication Module',
                durationSeconds: 7200,
                formattedDuration: '02h 00m',
                percentage: 66.67,
                subtasks: [
                  {
                    id: 'sub-token',
                    name: 'JWT Verification',
                    durationSeconds: 3600,
                    formattedDuration: '01h 00m',
                    percentage: 33.33,
                  },
                  {
                    id: 'sub-rbac',
                    name: 'RBAC Enforcement',
                    durationSeconds: 3600,
                    formattedDuration: '01h 00m',
                    percentage: 33.33,
                  },
                ],
              },
              {
                id: 'task-db',
                name: 'Database Migration',
                durationSeconds: 3600,
                formattedDuration: '01h 00m',
                percentage: 33.33,
                subtasks: [],
              },
            ],
          },
        ],
        rows: [
          {
            id: 'entry-1',
            date: '2026-11-08',
            projectName: 'Platform Core',
            taskName: 'Authentication Module',
            subtaskName: 'JWT Verification',
            startTime: '2026-11-08T09:00:00Z',
            endTime: '2026-11-08T10:00:00Z',
            durationSeconds: 3600,
            formattedDuration: '01h 00m',
            note: 'Implemented HS256 to RS256 algorithm validation',
          },
          {
            id: 'entry-2',
            date: '2026-11-08',
            projectName: 'Platform Core',
            taskName: 'Database Migration',
            startTime: '2026-11-08T11:00:00Z',
            endTime: '2026-11-08T12:00:00Z',
            durationSeconds: 3600,
            formattedDuration: '01h 00m',
            note: 'Applied SQLite migration 9',
          },
        ],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateReportXmlAgainstXsd(xml);

      expect(doc.querySelector('metadata > title')?.textContent).toBe(
        'Full Hierarchy Architecture Audit'
      );
      expect(doc.querySelector('metadata > period')?.textContent).toBe('Q4 2026');
      expect(doc.querySelectorAll('projects > project')).toHaveLength(1);
      expect(doc.querySelectorAll('tasks > task')).toHaveLength(2);
      expect(doc.querySelectorAll('subtasks > subtask')).toHaveLength(2);
      expect(doc.querySelectorAll('entries > entry')).toHaveLength(2);
    });
  });

  describe('Scenario 2: Minimal Report (Omitted Optional Fields)', () => {
    it('generates report omitting optional fields conforming to XSD minOccurs="0"', async () => {
      const payload = createReportPayload({
        title: undefined,
        period: 'Minimal Period',
        generatedAt: undefined,
        totalSeconds: 1800,
        formattedTotalDuration: '30m 00s',
        projectBreakdown: [
          {
            projectName: 'Project Without Optional Fields',
            seconds: 1800,
            percentage: 100,
            tasks: [
              {
                id: 'task-single',
                name: 'Direct Task',
                durationSeconds: 1800,
                formattedDuration: '30m 00s',
                percentage: 100,
              },
            ],
          },
        ],
        rows: [
          {
            id: 'e-min-1',
            date: '2026-11-08',
            projectName: 'Project Without Optional Fields',
            taskName: 'Direct Task',
            startTime: '2026-11-08T08:00:00Z',
            durationSeconds: 1800,
            formattedDuration: '30m 00s',
          },
        ],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateReportXmlAgainstXsd(xml);

      expect(xml).not.toContain('<title>');
      expect(xml).not.toContain('<generatedAt>');
      expect(xml).not.toContain('<subtasks');
      expect(xml).not.toContain('<subtaskName');
      expect(xml).not.toContain('<endTime');
      expect(xml).not.toContain('<note');

      expect(doc.querySelectorAll('projects > project')).toHaveLength(1);
      expect(doc.querySelectorAll('entries > entry')).toHaveLength(1);
    });
  });

  describe('Scenario 3: Empty Report (Zero Timers & Empty Sections)', () => {
    it('generates valid empty report with self-closing <projects/> and <entries/>', async () => {
      const payload = createReportPayload({
        title: undefined,
        period: 'Empty Sprint',
        generatedAt: undefined,
        totalSeconds: 0,
        formattedTotalDuration: '00m 00s',
        projectBreakdown: [],
        rows: [],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateReportXmlAgainstXsd(xml);

      expect(xml).toContain('<projects/>');
      expect(xml).toContain('<entries/>');
      expect(doc.querySelectorAll('projects > project')).toHaveLength(0);
      expect(doc.querySelectorAll('entries > entry')).toHaveLength(0);
      expect(doc.querySelector('summary > totalSeconds')?.textContent).toBe('0');
    });
  });

  describe('Scenario 4: Special Characters, XML Entities & Unicode', () => {
    it('properly escapes XML entities, sanitizes control chars, and preserves Unicode & Emoji', async () => {
      const payload = createReportPayload({
        title: 'Entities: & < > " \' and Polish: Zażółć gęślą jaźń 🚀',
        period: 'Sprint & Q1\u0000 <Test\u0007>',
        projectBreakdown: [
          {
            id: 'proj-special',
            projectName: 'R&D <Lab> "Core" \'Fast\' & \u0008Clean',
            seconds: 3600,
            formattedDuration: '01h 00m',
            percentage: 100,
            tasks: [
              {
                id: 'task-special',
                name: '日本語 & Cyrillic: Украинский & ąęół',
                durationSeconds: 3600,
                formattedDuration: '01h 00m',
                percentage: 100,
              },
            ],
          },
        ],
        rows: [
          {
            id: 'entry-special',
            date: '2026-11-08',
            projectName: 'R&D <Lab> "Core" \'Fast\' & \u0008Clean',
            taskName: '日本語 & Cyrillic: Украинский & ąęół',
            startTime: '2026-11-08T10:00:00Z',
            endTime: '2026-11-08T11:00:00Z',
            durationSeconds: 3600,
            formattedDuration: '01h 00m',
            note: 'Note with & < > " \' symbols & emoji: 🎉 🔥',
          },
        ],
      });

      const blob = await exporter.export(payload);
      const xml = await blob.text();
      const doc = validateReportXmlAgainstXsd(xml);

      // Verify no invalid control characters are present
      expect(xml).not.toContain('\u0000');
      expect(xml).not.toContain('\u0007');
      expect(xml).not.toContain('\u0008');

      // Verify XML entities are escaped in raw string
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
      expect(xml).toContain('&quot;');
      expect(xml).toContain('&apos;');

      // Verify DOM parser reconstructed intact strings
      expect(doc.querySelector('metadata > title')?.textContent).toBe(
        'Entities: & < > " \' and Polish: Zażółć gęślą jaźń 🚀'
      );
      expect(doc.querySelector('project > name')?.textContent).toBe(
        'R&D <Lab> "Core" \'Fast\' & Clean'
      );
      expect(doc.querySelector('entry > note')?.textContent).toBe(
        'Note with & < > " \' symbols & emoji: 🎉 🔥'
      );
    });
  });

  describe('Scenario 5: Negative Validation Suite (Schema Rejection)', () => {
    it('rejects XML documents missing the XML declaration prolog', () => {
      const invalidXml =
        '<report schemaVersion="1"><metadata><period>P</period></metadata><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/><entries/></report>';
      const result = inspectXmlSchemaConformance(invalidXml);
      expect(result.isValid).toBe(false);
    });

    it('rejects XML documents with missing or invalid schemaVersion', () => {
      const invalidVersionXml =
        '<?xml version="1.0" encoding="UTF-8"?>\n<report schemaVersion="2"><metadata><period>P</period></metadata><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/><entries/></report>';
      const result = inspectXmlSchemaConformance(invalidVersionXml);
      expect(result.isValid).toBe(false);
    });

    it('rejects XML documents with incorrect top-level section sequence', () => {
      // Inverted: <summary> placed before <metadata>
      const invertedXml =
        '<?xml version="1.0" encoding="UTF-8"?>\n<report schemaVersion="1"><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><metadata><period>P</period></metadata><projects/><entries/></report>';
      const result = inspectXmlSchemaConformance(invertedXml);
      expect(result.isValid).toBe(false);
    });

    it('rejects XML documents with non-numeric nonNegativeInteger values', () => {
      const invalidDurationXml =
        '<?xml version="1.0" encoding="UTF-8"?>\n<report schemaVersion="1"><metadata><period>P</period></metadata><summary><totalSeconds>-100</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/><entries/></report>';
      const result = inspectXmlSchemaConformance(invalidDurationXml);
      expect(result.isValid).toBe(false);
    });

    it('rejects XML documents with invalid xs:decimal percentage values', () => {
      const invalidDecimalXml =
        '<?xml version="1.0" encoding="UTF-8"?>\n<report schemaVersion="1"><metadata><period>P</period></metadata><summary><totalSeconds>3600</totalSeconds><formattedTotalDuration>1h</formattedTotalDuration></summary><projects><project><name>Proj</name><durationSeconds>3600</durationSeconds><percentage>invalid_decimal</percentage></project></projects><entries/></report>';
      const result = inspectXmlSchemaConformance(invalidDecimalXml);
      expect(result.isValid).toBe(false);
    });

    it('rejects XML documents with invalid xs:dateTime generatedAt values', () => {
      const invalidDateXml =
        '<?xml version="1.0" encoding="UTF-8"?>\n<report schemaVersion="1"><metadata><period>P</period><generatedAt>not-a-valid-date</generatedAt></metadata><summary><totalSeconds>0</totalSeconds><formattedTotalDuration>0s</formattedTotalDuration></summary><projects/><entries/></report>';
      const result = inspectXmlSchemaConformance(invalidDateXml);
      expect(result.isValid).toBe(false);
    });

    it('rejects XML documents with out-of-order child elements inside complex types', () => {
      // Inverted sequence: <formattedTotalDuration> before <totalSeconds>
      const outOfOrderXml =
        '<?xml version="1.0" encoding="UTF-8"?>\n<report schemaVersion="1"><metadata><period>P</period></metadata><summary><formattedTotalDuration>0s</formattedTotalDuration><totalSeconds>0</totalSeconds></summary><projects/><entries/></report>';
      const result = inspectXmlSchemaConformance(outOfOrderXml);
      expect(result.isValid).toBe(false);
    });
  });
});
