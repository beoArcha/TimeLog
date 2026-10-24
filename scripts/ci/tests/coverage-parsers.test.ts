import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseFrontendCoverage } from '../parsers/frontend-coverage-parser.js';
import { parseRustCoverage } from '../parsers/rust-coverage-parser.js';
import { parseTestResults } from '../parsers/test-results-parser.js';

describe('coverage and test result parsers', () => {
  const tempDir = path.resolve('temp_test_ci_artifacts');

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('parseTestResults', () => {
    it('should aggregate test counts from test-results json files', () => {
      // Arrange
      const sampleResults = {
        numTotalTests: 12,
        numPassedTests: 11,
        numFailedTests: 1,
        numPendingTests: 0,
        startTime: 1000,
        testResults: [
          {
            name: 'tests/unit/sample.test.ts',
            startTime: 1000,
            endTime: 1500,
            assertionResults: [
              {
                status: 'failed',
                title: 'sample test should pass',
                failureMessages: ['AssertionError: expected true']
              }
            ]
          }
        ]
      };
      fs.writeFileSync(
        path.join(tempDir, 'test-results-unit.json'),
        JSON.stringify(sampleResults),
        'utf8'
      );

      // Act
      const summary = parseTestResults([tempDir]);

      // Assert
      expect(summary.total).toBe(12);
      expect(summary.passed).toBe(11);
      expect(summary.failed).toBe(1);
      expect(summary.durationMs).toBe(500);
      expect(summary.failures).toHaveLength(1);
      expect(summary.failures[0].title).toBe('sample test should pass');
      expect(summary.frontend?.unit?.total).toBe(12);
      expect(summary.frontend?.all?.total).toBe(12);
    });

    it('should categorize tests into frontend and backend multi-tier suites', () => {
      // Arrange
      const feUnit = { numTotalTests: 10, numPassedTests: 10, numFailedTests: 0, numPendingTests: 0 };
      const feInt = { numTotalTests: 5, numPassedTests: 5, numFailedTests: 0, numPendingTests: 0 };
      const beUnit = { numTotalTests: 8, numPassedTests: 8, numFailedTests: 0, numPendingTests: 0 };
      const beInt = { numTotalTests: 4, numPassedTests: 4, numFailedTests: 0, numPendingTests: 0 };

      fs.writeFileSync(path.join(tempDir, 'test-results-unit.json'), JSON.stringify(feUnit), 'utf8');
      fs.writeFileSync(path.join(tempDir, 'test-results-integration.json'), JSON.stringify(feInt), 'utf8');
      fs.writeFileSync(path.join(tempDir, 'test-results-rust-unit.json'), JSON.stringify(beUnit), 'utf8');
      fs.writeFileSync(path.join(tempDir, 'test-results-rust-integration.json'), JSON.stringify(beInt), 'utf8');

      // Act
      const summary = parseTestResults([tempDir]);

      // Assert
      expect(summary.total).toBe(27);
      expect(summary.frontend?.unit?.total).toBe(10);
      expect(summary.frontend?.integration?.total).toBe(5);
      expect(summary.frontend?.all?.total).toBe(15);
      expect(summary.backend?.unit?.total).toBe(8);
      expect(summary.backend?.integration?.total).toBe(4);
      expect(summary.backend?.all?.total).toBe(12);
    });
  });

  describe('parseFrontendCoverage', () => {
    it('should parse frontend coverage and compute module breakdowns', () => {
      // Arrange
      const summaryPayload = {
        total: {
          lines: { total: 100, covered: 85, pct: 85 },
          statements: { total: 100, covered: 85, pct: 85 },
          branches: { total: 50, covered: 40, pct: 80 },
          functions: { total: 30, covered: 25, pct: 83.3 }
        },
        'src/features/timelogs/TimeLogList.tsx': {
          lines: { total: 50, covered: 45, pct: 90 },
          statements: { total: 50, covered: 45, pct: 90 },
          branches: { total: 20, covered: 18, pct: 90 },
          functions: { total: 10, covered: 9, pct: 90 }
        }
      };
      const summaryFile = path.join(tempDir, 'coverage-summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(summaryPayload), 'utf8');

      // Act
      const result = parseFrontendCoverage([summaryFile]);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.total?.lines?.pct).toBe(85);
      expect(result?.breakdown).toHaveLength(1);
      expect(result?.breakdown[0].name).toBe('src/features/');
      expect(result?.breakdown[0].lines).toBe(90);
    });

    it('should return null when no coverage candidate files exist', () => {
      // Arrange
      const searchPaths = [path.join(tempDir, 'nonexistent.json')];

      // Act
      const result = parseFrontendCoverage(searchPaths);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('parseRustCoverage', () => {
    it('should parse tarpaulin json with segment arrays and aggregate metrics', () => {
      // Arrange
      const tarpaulinPayload = {
        covered: 40,
        coverable: 50,
        files: {
          'src/engine/timer.rs': { covered: 20, coverable: 25 },
          'src/repositories/task_repo.rs': [0, 1, 1, 0, 1]
        }
      };
      const tarpaulinFile = path.join(tempDir, 'tarpaulin-report.json');
      fs.writeFileSync(tarpaulinFile, JSON.stringify(tarpaulinPayload), 'utf8');

      // Act
      const result = parseRustCoverage([tempDir]);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.linesPct).toBe(80);
      expect(result?.breakdown.some((b) => b.name === 'src-tauri/src/engine/')).toBe(true);
    });

    it('should return null when no rust coverage files exist', () => {
      // Arrange
      const searchPaths = [path.join(tempDir, 'empty')];

      // Act
      const result = parseRustCoverage(searchPaths);

      // Assert
      expect(result).toBeNull();
    });
  });
});
