import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPORT_XML_SCHEMA_V1,
  reportXmlSchemaV1,
  getReportXmlSchema,
} from '@plugins/exporters/reportXmlSchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('reportXmlSchema', () => {
  const schemaDiskPath = path.resolve(
    __dirname,
    '../../../../schemas/xml/report/v1/report.xsd'
  );

  it('provides a non-empty REPORT_XML_SCHEMA_V1 with valid XML prolog and xs:schema declaration', () => {
    expect(REPORT_XML_SCHEMA_V1).toBeDefined();
    expect(REPORT_XML_SCHEMA_V1.trim().length).toBeGreaterThan(0);
    expect(REPORT_XML_SCHEMA_V1).toBe(reportXmlSchemaV1);

    expect(REPORT_XML_SCHEMA_V1.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(REPORT_XML_SCHEMA_V1).toContain('<xs:schema');
    expect(REPORT_XML_SCHEMA_V1).toContain('xmlns:xs="http://www.w3.org/2001/XMLSchema"');
  });

  it('declares the root element <report> with fixed schemaVersion="1" attribute', () => {
    const schema = getReportXmlSchema('1');
    expect(schema).toBeDefined();
    expect(schema).toContain('<xs:element name="report">');
    expect(schema).toContain('name="schemaVersion"');
    expect(schema).toContain('fixed="1"');
    expect(schema).toContain('<xs:element name="metadata"');
    expect(schema).toContain('<xs:element name="summary"');
    expect(schema).toContain('<xs:element name="projects"');
    expect(schema).toContain('<xs:element name="entries"');
  });

  it('throws an error for unsupported schema versions', () => {
    expect(() => getReportXmlSchema('2')).toThrow(
      "Unsupported XML schema version: '2'. Supported versions: '1'"
    );
    expect(() => getReportXmlSchema('')).toThrow(
      "Unsupported XML schema version: ''. Supported versions: '1'"
    );
  });

  it('is byte-for-byte identical to schemas/xml/report/v1/report.xsd on disk', () => {
    expect(fs.existsSync(schemaDiskPath)).toBe(true);
    const diskContent = fs.readFileSync(schemaDiskPath, 'utf-8');
    const diskBuffer = fs.readFileSync(schemaDiskPath);

    // Assert string content equality
    expect(REPORT_XML_SCHEMA_V1).toBe(diskContent);
    expect(getReportXmlSchema('1')).toBe(diskContent);

    // Assert raw byte-for-byte identity
    const embeddedBuffer = Buffer.from(REPORT_XML_SCHEMA_V1, 'utf-8');
    expect(embeddedBuffer.equals(diskBuffer)).toBe(true);
  });
});
