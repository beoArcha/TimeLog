import reportXmlSchemaV1 from '../../../schemas/xml/report/v1/report.xsd?raw';

export const REPORT_XML_SCHEMA_V1: string = reportXmlSchemaV1;
export { reportXmlSchemaV1 };

/**
 * Returns the XML schema string for the specified report schema version.
 *
 * @param version - The schema version string (defaults to '1').
 * @throws Error if the requested version is unsupported.
 */
export function getReportXmlSchema(version = '1'): string {
  if (version === '1') {
    return reportXmlSchemaV1;
  }
  throw new Error(`Unsupported XML schema version: '${version}'. Supported versions: '1'`);
}
