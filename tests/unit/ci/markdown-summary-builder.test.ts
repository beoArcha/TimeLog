import { describe, expect, it } from 'vitest';
import {
  buildMarkdownSummary,
  formatPct,
  getStatusBadge
} from '../../../scripts/ci/formatters/markdown-summary-builder.js';

describe('markdown-summary-builder', () => {
  describe('formatPct', () => {
    it('should return green formatted badge when percentage is 80 or higher', () => {
      // Arrange & Act & Assert
      expect(formatPct(85)).toBe('🟢 `85.0%`');
      expect(formatPct(80)).toBe('🟢 `80.0%`');
    });

    it('should return yellow formatted badge when percentage is between 60 and 80', () => {
      // Arrange & Act & Assert
      expect(formatPct(75.5)).toBe('🟡 `75.5%`');
      expect(formatPct(60)).toBe('🟡 `60.0%`');
    });

    it('should return red formatted badge when percentage is below 60', () => {
      // Arrange & Act & Assert
      expect(formatPct(59.9)).toBe('🔴 `59.9%`');
      expect(formatPct(0)).toBe('🔴 `0.0%`');
    });

    it('should return em-dash when percentage is null, undefined, or NaN', () => {
      // Arrange & Act & Assert
      expect(formatPct(null)).toBe('—');
      expect(formatPct(undefined)).toBe('—');
      expect(formatPct(Number.NaN)).toBe('—');
    });
  });

  describe('getStatusBadge', () => {
    it('should return PASS badge when percentage is 80 or above', () => {
      // Arrange & Act & Assert
      expect(getStatusBadge(80)).toBe('🟢 PASS');
      expect(getStatusBadge(95)).toBe('🟢 PASS');
    });

    it('should return WARN badge when percentage is between 60 and 80', () => {
      // Arrange & Act & Assert
      expect(getStatusBadge(60)).toBe('🟡 WARN');
      expect(getStatusBadge(79.9)).toBe('🟡 WARN');
    });

    it('should return FAIL badge when percentage is below 60', () => {
      // Arrange & Act & Assert
      expect(getStatusBadge(59.9)).toBe('🔴 FAIL');
    });

    it('should return UNKNOWN badge when percentage is not a valid number', () => {
      // Arrange & Act & Assert
      expect(getStatusBadge(null)).toBe('⚪ UNKNOWN');
    });
  });

  describe('buildMarkdownSummary', () => {
    it('should render test status card with PASSED status when zero tests failed', () => {
      // Arrange
      const testResults = {
        total: 10,
        passed: 10,
        failed: 0,
        skipped: 0,
        durationMs: 520,
        failures: []
      };

      // Act
      const markdown = buildMarkdownSummary(testResults, null, null, new Date('2026-10-22T00:00:00Z'));

      // Assert
      expect(markdown).toContain('<!-- oxyflow-test-coverage-summary -->');
      expect(markdown).toContain('**✅ PASSED**');
      expect(markdown).toContain('`10` ✅');
      expect(markdown).toContain('`0.52s` ⏱️');
      expect(markdown).toContain('*No coverage reports detected in current artifacts.*');
    });

    it('should render collapsible failure blocks when tests have failed', () => {
      // Arrange
      const testResults = {
        total: 5,
        passed: 4,
        failed: 1,
        skipped: 0,
        durationMs: 1200,
        failures: [
          {
            file: 'tests/unit/sample.test.ts',
            title: 'Sample > should fail',
            message: 'AssertionError: expected true to be false'
          }
        ]
      };

      // Act
      const markdown = buildMarkdownSummary(testResults, null, null, new Date('2026-10-22T00:00:00Z'));

      // Assert
      expect(markdown).toContain('**❌ FAILED**');
      expect(markdown).toContain('### ❌ Failed Tests (1)');
      expect(markdown).toContain('<code>tests/unit/sample.test.ts</code> &gt; Sample > should fail');
      expect(markdown).toContain('AssertionError: expected true to be false');
    });

    it('should render coverage table with module breakdowns for frontend and backend layers', () => {
      // Arrange
      const testResults = {
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        durationMs: 100,
        failures: []
      };
      const frontendCov = {
        total: {
          lines: { pct: 85.0 },
          statements: { pct: 86.0 },
          branches: { pct: 80.0 },
          functions: { pct: 82.0 }
        },
        breakdown: [
          { name: 'src/features/', lines: 90.0, statements: 91.0, branches: 85.0, functions: 88.0 }
        ]
      };
      const rustCov = {
        linesPct: 75.0,
        covered: 150,
        coverable: 200,
        breakdown: [
          { name: 'src-tauri/src/engine/', lines: 85.0, covered: 85, total: 100 }
        ]
      };

      // Act
      const markdown = buildMarkdownSummary(testResults, frontendCov, rustCov, new Date('2026-10-22T00:00:00Z'));

      // Assert
      expect(markdown).toContain('**Frontend (TypeScript / React)**');
      expect(markdown).toContain('`src/features/`');
      expect(markdown).toContain('**Backend Engine (Rust / SQLite)**');
      expect(markdown).toContain('`src-tauri/src/engine/`');
      expect(markdown).toContain('**Overall Combined Project**');
      expect(markdown).toContain('🟢 `80.0%`');
    });
  });
});
