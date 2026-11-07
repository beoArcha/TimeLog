import { describe, it, expect, vi } from 'vitest';
import { CsvExporterPlugin } from '@plugins/exporters/CsvExporterPlugin';
import { JsonExporterPlugin } from '@plugins/exporters/JsonExporterPlugin';
import { MarkdownClipboardExporterPlugin } from '@plugins/exporters/MarkdownClipboardExporterPlugin';
import {
  XmlExporterPlugin,
  isValidXml10CodePoint,
  sanitizeXml10,
  escapeXml,
  createXmlElement,
  createXmlBlock,
} from '@plugins/exporters/XmlExporterPlugin';
import { ExportPayload } from '@plugins/contracts/IExporterPlugin';

describe('Built-in Exporter Plugins', () => {
  const samplePayload: ExportPayload = {
    title: 'Time Summaries & Reports',
    period: 'week',
    generatedAt: '2026-10-19 12:00:00',
    totalSeconds: 7200,
    formattedTotalDuration: '02:00:00',
    projectBreakdown: [
      { projectName: 'Project "Alpha"', seconds: 7200, percentage: 100 },
    ],
    rows: [
      {
        id: 'row-1',
        date: '2026-10-19',
        projectName: 'Project "Alpha"',
        taskName: 'Coding, Testing & Review',
        startTime: '10:00:00',
        endTime: '12:00:00',
        durationSeconds: 7200,
        formattedDuration: '02:00:00',
        note: 'Line 1\nLine 2 with "quotes", and commas',
      },
    ],
  };

  describe('CsvExporterPlugin', () => {
    it('should export valid RFC 4180 CSV with UTF-8 BOM and escaped fields', async () => {
      // Arrange
      const exporter = new CsvExporterPlugin();

      // Act
      const blob = await exporter.export(samplePayload);
      const text = await blob.text();

      // Assert
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);
      expect(text).toContain('Date,Project,Task,Start Time,End Time,Duration (s),Formatted Duration,Note');
      // Quotes should be doubled and field wrapped in quotes
      expect(text).toContain('"Project ""Alpha"""');
      // Commas and newlines should be wrapped in quotes
      expect(text).toContain('"Coding, Testing & Review"');
      expect(text).toContain('"Line 1\nLine 2 with ""quotes"", and commas"');
    });
  });

  describe('JsonExporterPlugin', () => {
    it('should export valid formatted JSON blob matching payload schema', async () => {
      // Arrange
      const exporter = new JsonExporterPlugin();

      // Act
      const blob = await exporter.export(samplePayload);
      const text = await blob.text();
      const parsed = JSON.parse(text);

      // Assert
      expect(parsed.title).toBe(samplePayload.title);
      expect(parsed.totalSeconds).toBe(7200);
      expect(parsed.rows).toHaveLength(1);
      expect(parsed.rows[0].projectName).toBe('Project "Alpha"');
    });
  });

  describe('XmlExporterPlugin', () => {
    it('should export valid XML v1 with root schemaVersion="1", metadata, summary, projects, and entries sections', async () => {
      // Arrange
      const exporter = new XmlExporterPlugin();

      // Act
      const blob = await exporter.export(samplePayload);
      const text = await blob.text();

      // Assert
      expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(text).toContain('<report schemaVersion="1">');
      expect(text).toContain('<metadata>');
      expect(text).toContain('<title>Time Summaries &amp; Reports</title>');
      expect(text).toContain('<period>week</period>');
      expect(text).toContain('<summary>');
      expect(text).toContain('<totalSeconds>7200</totalSeconds>');
      expect(text).toContain('<formattedTotalDuration>02:00:00</formattedTotalDuration>');
      expect(text).toContain('<projects>');
      expect(text).toContain('<name>Project &quot;Alpha&quot;</name>');
      expect(text).toContain('<entries>');
      expect(text).toContain('<taskName>Coding, Testing &amp; Review</taskName>');
    });

    it('should produce a well-formed XML document that parses without DOMParser errors and preserves Unicode and emoji', async () => {
      const exporter = new XmlExporterPlugin();
      const unicodePayload: ExportPayload = {
        title: 'Raport zażółć gęślą jaźń & <Special> "Chars"',
        period: 'month',
        generatedAt: '2026-11-06T20:00:00Z',
        totalSeconds: 3600,
        formattedTotalDuration: '01:00:00',
        projectBreakdown: [
          { projectName: 'Projet Français & 日本語 🚀', seconds: 3600, percentage: 100 },
        ],
        rows: [
          {
            id: 'row-unicode',
            date: '2026-11-06',
            projectName: 'Projet Français & 日本語 🚀',
            taskName: 'Task with control char \u0007 and \u0000 stripped 😀',
            startTime: '09:00:00',
            endTime: '10:00:00',
            durationSeconds: 3600,
            formattedDuration: '01:00:00',
            note: 'Line with <tags> & "quotes" and Polish: ĄĆĘŁŃÓŚŹŻ',
          },
        ],
      };

      // Act
      const blob = await exporter.export(unicodePayload);
      const xmlString = await blob.text();

      // Parse XML document
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'application/xml');

      // Assert
      const parseError = doc.querySelector('parsererror');
      expect(parseError).toBeNull();

      expect(doc.documentElement.nodeName).toBe('report');
      expect(doc.documentElement.getAttribute('schemaVersion')).toBe('1');

      expect(doc.querySelector('metadata > title')?.textContent).toBe(
        'Raport zażółć gęślą jaźń & <Special> "Chars"'
      );
      expect(doc.querySelector('summary > totalSeconds')?.textContent).toBe('3600');
      expect(doc.querySelector('summary > formattedTotalDuration')?.textContent).toBe('01:00:00');

      const projects = doc.querySelectorAll('projects > project');
      expect(projects).toHaveLength(1);
      expect(projects[0].querySelector('name')?.textContent).toBe('Projet Français & 日本語 🚀');
      expect(projects[0].querySelector('durationSeconds')?.textContent).toBe('3600');
      expect(projects[0].querySelector('percentage')?.textContent).toBe('100');

      const entries = doc.querySelectorAll('entries > entry');
      expect(entries).toHaveLength(1);
      const entry = entries[0];
      expect(entry.querySelector('projectName')?.textContent).toBe('Projet Français & 日本語 🚀');
      expect(entry.querySelector('taskName')?.textContent).toBe(
        'Task with control char  and  stripped 😀'
      );
      expect(entry.querySelector('note')?.textContent).toBe(
        'Line with <tags> & "quotes" and Polish: ĄĆĘŁŃÓŚŹŻ'
      );
    });

    it('should correctly sanitize XML 1.0 disallowed characters while preserving valid code points', () => {
      // Disallowed: 0x00, 0x07, 0x08, 0x0B, 0x0C, 0x0E-0x1F, 0xFFFE, 0xFFFF, lone surrogates
      expect(isValidXml10CodePoint(0x00)).toBe(false);
      expect(isValidXml10CodePoint(0x07)).toBe(false);
      expect(isValidXml10CodePoint(0x08)).toBe(false);
      expect(isValidXml10CodePoint(0x0b)).toBe(false);
      expect(isValidXml10CodePoint(0x0c)).toBe(false);
      expect(isValidXml10CodePoint(0x1f)).toBe(false);
      expect(isValidXml10CodePoint(0xfffe)).toBe(false);
      expect(isValidXml10CodePoint(0xffff)).toBe(false);
      expect(isValidXml10CodePoint(0xd800)).toBe(false);

      // Allowed: TAB (9), LF (10), CR (13), regular ASCII, Polish, Japanese, Emoji
      expect(isValidXml10CodePoint(0x09)).toBe(true);
      expect(isValidXml10CodePoint(0x0a)).toBe(true);
      expect(isValidXml10CodePoint(0x0d)).toBe(true);
      expect(isValidXml10CodePoint(0x20)).toBe(true);
      expect(isValidXml10CodePoint('a'.charCodeAt(0))).toBe(true);
      expect(isValidXml10CodePoint('ą'.charCodeAt(0))).toBe(true);
      expect(isValidXml10CodePoint(0x1f600)).toBe(true);

      const dirty = 'Hello\u0000\u0007 World\t!\nTest\r\uFFFE\uFFFF 🚀';
      const clean = sanitizeXml10(dirty);
      expect(clean).toBe('Hello World\t!\nTest\r 🚀');
      expect(escapeXml(dirty)).toBe('Hello World\t!\nTest\r 🚀');
    });

    it('should render self-closing tags when projects or entries are empty', async () => {
      const exporter = new XmlExporterPlugin();
      const emptyPayload: ExportPayload = {
        title: 'Empty Report',
        period: 'Today',
        generatedAt: '2026-11-07 10:00:00',
        totalSeconds: 0,
        formattedTotalDuration: '00:00:00',
        projectBreakdown: [],
        rows: [],
      };

      const blob = await exporter.export(emptyPayload);
      const text = await blob.text();

      expect(text).toContain('<projects/>');
      expect(text).toContain('<entries/>');
    });

    it('should correctly format XML leaf elements and block elements with createXmlElement and createXmlBlock', () => {
      expect(createXmlElement('name', 'Alpha & Beta', 2)).toBe('  <name>Alpha &amp; Beta</name>');
      expect(createXmlElement('empty', null)).toBe('');
      expect(createXmlElement('empty', undefined)).toBe('');

      const leaf1 = createXmlElement('tag', 'val', 2);
      const block = createXmlBlock('parent', [leaf1], 0, { attr: 'foo "bar"' });
      expect(block).toBe('<parent attr="foo &quot;bar&quot;">\n  <tag>val</tag>\n</parent>');

      const emptyBlock = createXmlBlock('empty', [], 0);
      expect(emptyBlock).toBe('<empty/>');
    });
  });

  describe('MarkdownClipboardExporterPlugin', () => {
    it('should format payload into a Markdown table with summary and breakdown', async () => {
      // Arrange
      const exporter = new MarkdownClipboardExporterPlugin();

      // Act
      const markdown = await exporter.export(samplePayload);

      // Assert
      expect(markdown).toContain('# Time Summaries & Reports');
      expect(markdown).toContain('**Period**: week');
      expect(markdown).toContain('### Activity Log');
      expect(markdown).toContain('| Date | Project | Task | Start | End | Duration | Note |');
      expect(markdown).toContain('| 2026-10-19 | Project "Alpha" | Coding, Testing & Review | 10:00:00 | 12:00:00 | 02:00:00 |');
    });

    it('should copy to clipboard when copyToClipboard is invoked', async () => {
      // Arrange
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });
      const exporter = new MarkdownClipboardExporterPlugin();

      // Act
      const result = await exporter.copyToClipboard(samplePayload);

      // Assert
      expect(writeTextMock).toHaveBeenCalledWith(result);
      expect(result).toContain('# Time Summaries & Reports');
    });
  });
});
