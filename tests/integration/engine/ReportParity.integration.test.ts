import { describe, it, expect } from 'vitest';
import parityVectors from '../../fixtures/report-parity-vectors.json';
import type { ReportDocument } from '@bindings/ReportDocument';
import type { ReportRequest } from '@bindings/ReportRequest';
import type { ResolvedRange } from '@bindings/ResolvedRange';
import { buildReportAt, type ReportSnapshot } from '@common/engine/reports';
import { GENERATOR_VERSION } from '@common/engine/reports/constants';

/** Stands in for the release-specific generator version in the shared vectors; see the Rust test. */
const VERSION_TOKEN = '<engine-version>';

interface ReportVector {
  description: string;
  snapshot: ReportSnapshot;
  request: ReportRequest;
  range: ResolvedRange;
  generatedAt: string;
  expected?: ReportDocument;
  expectedErrorCode?: string;
}

const vectors = parityVectors.vectors as unknown as ReportVector[];
const successVectors = vectors.filter((vector) => vector.expected !== undefined);
const errorVectors = vectors.filter((vector) => vector.expectedErrorCode !== undefined);

function buildVector(vector: ReportVector): ReportDocument {
  return buildReportAt(vector.snapshot, vector.request, vector.range, new Date(vector.generatedAt));
}

function withLocalVersion(expected: ReportDocument): ReportDocument {
  expect(expected.generator.version).toBe(VERSION_TOKEN);
  return { ...expected, generator: { ...expected.generator, version: GENERATOR_VERSION } };
}

describe('Given the shared report parity vectors', () => {
  it('Then it should cover every scenario the Rust engine tests pin down', () => {
    // Given
    const minimumVectors = 12;

    // When
    const total = successVectors.length;

    // Then
    expect(total).toBeGreaterThanOrEqual(minimumVectors);
  });

  describe('When building a report from a valid snapshot', () => {
    it.each(successVectors)('Then it should deep-equal the Rust document: $description', (vector) => {
      // Given
      const expected = withLocalVersion(vector.expected as ReportDocument);

      // When
      const document = buildVector(vector);

      // Then
      expect(document).toStrictEqual(expected);
    });

    it.each(successVectors)(
      'Then it should serialize byte-identically to the Rust document, keys in contract order: $description',
      (vector) => {
        // Given
        const expected = withLocalVersion(vector.expected as ReportDocument);

        // When
        const json = JSON.stringify(buildVector(vector));

        // Then
        expect(json).toBe(JSON.stringify(expected));
      }
    );
  });

  describe('When building a report from a snapshot the Rust engine rejects', () => {
    it.each(errorVectors)('Then it should fail with the Rust error code: $description', (vector) => {
      // Given
      const expectedCode = vector.expectedErrorCode;

      // When
      const act = () => buildVector(vector);

      // Then
      expect(act).toThrow(expect.objectContaining({ code: expectedCode }));
    });
  });
});
