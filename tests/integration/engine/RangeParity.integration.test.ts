import { describe, it, expect } from 'vitest';
import parityVectors from '../../fixtures/range-parity-vectors.json';
import type { RangeRequest } from '@bindings/RangeRequest';
import { resolveRangeAt } from '@common/engine/range/resolveRange';
import { resolveTimezone } from '@common/engine/range/timezone';

const rangeVectors = parityVectors.rangeVectors as ReadonlyArray<{
  description: string;
  request: RangeRequest;
  now: string;
  timeZone: string;
  expected?: unknown;
  expectedErrorCode?: string;
}>;

const successVectors = rangeVectors.filter((vector) => vector.expected !== undefined);
const errorVectors = rangeVectors.filter((vector) => vector.expectedErrorCode !== undefined);

function resolveVector(vector: (typeof rangeVectors)[number]) {
  const timeZone = resolveTimezone(vector.timeZone);
  return resolveRangeAt(vector.request, new Date(vector.now), timeZone);
}

describe('Given the shared range parity vectors', () => {
  describe('When resolving a valid request', () => {
    it.each(successVectors)('Then it should match the Rust engine: $description', (vector) => {
      // Given
      const expected = vector.expected;

      // When
      const result = resolveVector(vector);

      // Then
      expect(result).toEqual(expected);
    });
  });

  describe('When resolving an invalid request', () => {
    it.each(errorVectors)('Then it should fail with the Rust error code: $description', (vector) => {
      // Given
      const expectedCode = vector.expectedErrorCode;

      // When
      const act = () => resolveVector(vector);

      // Then
      expect(act).toThrow(expect.objectContaining({ code: expectedCode }));
    });
  });

  describe('When resolving a timezone from explicit and setting values', () => {
    const vectors = parityVectors.timezoneVectors;

    it.each(vectors.filter((vector) => 'expected' in vector))(
      'Then it should pick the same zone as the Rust engine: $description',
      ({ explicit, setting, expected }) => {
        // Given
        const inputs: [string | null, string | null] = [explicit, setting];

        // When
        const result = resolveTimezone(...inputs);

        // Then
        expect(result).toBe(expected);
      },
    );

    it.each(vectors.filter((vector) => 'expectedErrorCode' in vector))(
      'Then it should reject with the Rust error code: $description',
      ({ explicit, setting, expectedErrorCode }) => {
        // Given
        const inputs: [string | null, string | null] = [explicit, setting];

        // When
        const act = () => resolveTimezone(...inputs);

        // Then
        expect(act).toThrow(expect.objectContaining({ code: expectedErrorCode }));
      },
    );
  });
});
