import { describe, expect, it } from 'vitest';
import {
  formatPct,
  getExecutionStatusBadge,
  getStatusBadge
} from '../formatters/badge-formatter.js';
import {
  buildMarkdownSummary,
  MarkdownSummaryBuilder
} from '../formatters/markdown-summary-builder.js';
import { MarkdownTableFormatter } from '../formatters/markdown-table-formatter.js';

describe('markdown-summary-builder', () => {
  describe('formatPct', () => {
    it('should return green formatted badge when percentage is 80 or higher', () => {
      // Arrange
      const scoreA = 85;
      const scoreB = 80;

      // Act
      const badgeA = formatPct(scoreA);
      const badgeB = formatPct(scoreB);

      // Assert
      expect(badgeA).toBe('🟢 `85.0%`');
      expect(badgeB).toBe('🟢 `80.0%`');
    });

    it('should return yellow formatted badge when percentage is between 60 and 80', () => {
      // Arrange
      const scoreA = 75.5;
      const scoreB = 60;

      // Act
      const badgeA = formatPct(scoreA);
      const badgeB = formatPct(scoreB);

      // Assert
      expect(badgeA).toBe('🟡 `75.5%`');
      expect(badgeB).toBe('🟡 `60.0%`');
    });

    it('should return red formatted badge when percentage is below 60', () => {
      // Arrange
      const scoreA = 59.9;
      const scoreB = 0;

      // Act
      const badgeA = formatPct(scoreA);
      const badgeB = formatPct(scoreB);

      // Assert
      expect(badgeA).toBe('🔴 `59.9%`');
      expect(badgeB).toBe('🔴 `0.0%`');
    });

    it('should return em-dash when percentage is null, undefined, or NaN', () => {
      // Arrange
      const nullVal = null;
      const undefinedVal = undefined;
      const nanVal = Number.NaN;

      // Act
      const resNull = formatPct(nullVal);
      const resUndefined = formatPct(undefinedVal);
      const resNan = formatPct(nanVal);

      // Assert
      expect(resNull).toBe('—');
      expect(resUndefined).toBe('—');
      expect(resNan).toBe('—');
    });
  });

  describe('getStatusBadge', () => {
    it('should return PASS badge when percentage is 80 or above', () => {
      // Arrange
      const scoreA = 80;
      const scoreB = 95;

      // Act
      const badgeA = getStatusBadge(scoreA);
      const badgeB = getStatusBadge(scoreB);

      // Assert
      expect(badgeA).toBe('🟢 PASS');
      expect(badgeB).toBe('🟢 PASS');
    });

    it('should return WARN badge when percentage is between 60 and 80', () => {
      // Arrange
      const scoreA = 60;
      const scoreB = 79.9;

      // Act
      const badgeA = getStatusBadge(scoreA);
      const badgeB = getStatusBadge(scoreB);

      // Assert
      expect(badgeA).toBe('🟡 WARN');
      expect(badgeB).toBe('🟡 WARN');
    });

    it('should return FAIL badge when percentage is below 60', () => {
      // Arrange
      const score = 59.9;

      // Act
      const badge = getStatusBadge(score);

      // Assert
      expect(badge).toBe('🔴 FAIL');
    });

    it('should return UNKNOWN badge when percentage is not a valid number', () => {
      // Arrange
      const invalidVal = null;

      // Act
      const badge = getStatusBadge(invalidVal);

      // Assert
      expect(badge).toBe('⚪ UNKNOWN');
    });
  });

  describe('getExecutionStatusBadge', () => {
    it('should return PASSED badge when failures count is zero', () => {
      // Arrange
      const failed = 0;
      const total = 50;

      // Act
      const badge = getExecutionStatusBadge(failed, total);

      // Assert
      expect(badge).toBe('✅ PASSED');
    });

    it('should return FAILED badge when failures count exceeds zero', () => {
      // Arrange
      const failed = 2;
      const total = 50;

      // Act
      const badge = getExecutionStatusBadge(failed, total);

      // Assert
      expect(badge).toBe('❌ FAILED');
    });

    it('should return NO TESTS badge when total count is zero', () => {
      // Arrange
      const failed = 0;
      const total = 0;

      // Act
      const badge = getExecutionStatusBadge(failed, total);

      // Assert
      expect(badge).toBe('⚪ NO TESTS');
    });
  });

  describe('MarkdownTableFormatter', () => {
    it('should render header, alignments, and rows accurately', () => {
      // Arrange
      const table = new MarkdownTableFormatter(
        ['Name', 'Count', 'Status'],
        [':---', ':---:', '---:']
      );

      // Act
      table.addRow(['Engine', 42, 'OK']);
      const rendered = table.render();

      // Assert
      expect(rendered).toBe(
        '| Name | Count | Status |\n' +
        '| :--- | :---: | ---: |\n' +
        '| Engine | 42 | OK |'
      );
    });
  });

  describe('MarkdownSummaryBuilder', () => {
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
      const markdown = new MarkdownSummaryBuilder()
        .withTestResults(testResults)
        .withTimestamp(new Date('2026-10-22T00:00:00Z'))
        .build();

      // Assert
      expect(markdown).toContain('<!-- oxyflow-test-coverage-summary -->');
      expect(markdown).toContain('**✅ PASSED**');
      expect(markdown).toContain('`10` ✅');
      expect(markdown).toContain('`0.52s` ⏱️');
      expect(markdown).toContain('*No coverage reports detected in current artifacts.*');
    });

    it('should render separate multi-tier execution tables when frontend and backend breakdowns are provided', () => {
      // Arrange
      const testResults = {
        total: 150,
        passed: 148,
        failed: 2,
        skipped: 0,
        durationMs: 5000,
        failures: [],
        frontend: {
          all: { total: 100, passed: 100, failed: 0, skipped: 0, durationMs: 2000 },
          unit: { total: 80, passed: 80, failed: 0, skipped: 0, durationMs: 1500 },
          integration: { total: 20, passed: 20, failed: 0, skipped: 0, durationMs: 500 }
        },
        backend: {
          all: { total: 50, passed: 48, failed: 2, skipped: 0, durationMs: 3000 },
          unit: { total: 30, passed: 30, failed: 0, skipped: 0, durationMs: 1000 },
          integration: { total: 20, passed: 18, failed: 2, skipped: 0, durationMs: 2000 }
        }
      };

      // Act
      const markdown = buildMarkdownSummary(testResults, null, null, new Date('2026-10-22T00:00:00Z'));

      // Assert
      expect(markdown).toContain('#### 🌐 Frontend Tests');
      expect(markdown).toContain('**All Frontend**');
      expect(markdown).toContain('↳ Unit Tests');
      expect(markdown).toContain('↳ Integration Tests');
      expect(markdown).toContain('#### 🦀 Backend Tests (Rust Engine)');
      expect(markdown).toContain('**All Backend**');
      expect(markdown).toContain('`2` ❌');
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

    it('should render separate frontend and backend coverage tables with collapsible module breakdowns', () => {
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
        all: {
          lines: { pct: 85.0 },
          statements: { pct: 86.0 },
          branches: { pct: 80.0 },
          functions: { pct: 82.0 }
        },
        unit: {
          lines: { pct: 88.0 },
          statements: { pct: 89.0 },
          branches: { pct: 82.0 },
          functions: { pct: 85.0 }
        },
        integration: {
          lines: { pct: 75.0 },
          statements: { pct: 76.0 },
          branches: { pct: 70.0 },
          functions: { pct: 72.0 }
        },
        breakdown: [
          { name: 'src/features/', lines: 90.0, statements: 91.0, branches: 85.0, functions: 88.0 }
        ]
      };
      const rustCov = {
        linesPct: 75.0,
        all: { linesPct: 75.0 },
        unit: { linesPct: 80.0 },
        integration: { linesPct: 70.0 },
        covered: 150,
        coverable: 200,
        breakdown: [
          { name: 'src-tauri/src/engine/', lines: 85.0, covered: 85, total: 100 }
        ]
      };

      // Act
      const markdown = buildMarkdownSummary(testResults, frontendCov, rustCov, new Date('2026-10-22T00:00:00Z'));

      // Assert
      expect(markdown).toContain('#### 🌐 Frontend Code Coverage');
      expect(markdown).toContain('**All Frontend**');
      expect(markdown).toContain('Expand for Frontend Module Breakdown');
      expect(markdown).toContain('`src/features/`');
      expect(markdown).toContain('#### 🦀 Backend Code Coverage (Rust Engine)');
      expect(markdown).toContain('**All Backend**');
      expect(markdown).toContain('Expand for Backend Module Breakdown');
      expect(markdown).toContain('`src-tauri/src/engine/`');
      expect(markdown).toContain('#### 📈 Combined Full-Stack Coverage');
      expect(markdown).toContain('🟢 `80.0%`');
    });
  });
});
