import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import {
  TestGovernanceRule,
  TEST_GOVERNANCE_ALLOWLIST,
  SnakeCaseTestTitleDetector,
  RawDomQueryDetector,
  TestAstScanner,
} from '../rules/test-governance.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Test Governance & Quality Standards Enforcement', () => {
  describe('Unit: SnakeCaseTestTitleDetector', () => {
    const detector = new SnakeCaseTestTitleDetector();
    const scanner = new TestAstScanner([detector]);

    it('should flag snake_case test titles without spaces', () => {
      // Arrange
      const snippet = `
        it("should_render_compact_view", () => {
          expect(true).toBe(true);
        });
      `;

      // Act
      const violations = scanner.scan(snippet, 'test-dummy.test.ts');

      // Assert
      expect(violations).toHaveLength(1);
      expect(violations[0].target).toBe('should_render_compact_view');
      expect(violations[0].message).toContain('Forbidden snake_case test name');
    });

    it('should allow descriptive sentence test titles containing spaces', () => {
      // Arrange
      const snippet = `
        it("should render compact view when layout variant is compact", () => {
          expect(true).toBe(true);
        });
      `;

      // Act
      const violations = scanner.scan(snippet, 'test-dummy.test.ts');

      // Assert
      expect(violations).toHaveLength(0);
    });

    it('should allow sentence test titles referencing snake_case identifiers with spaces', () => {
      // Arrange
      const snippet = `
        it("should invoke get_computed_metrics when fetching metrics", () => {
          expect(true).toBe(true);
        });
      `;

      // Act
      const violations = scanner.scan(snippet, 'test-dummy.test.ts');

      // Assert
      expect(violations).toHaveLength(0);
    });
  });

  describe('Unit: RawDomQueryDetector', () => {
    const detector = new RawDomQueryDetector();
    const scanner = new TestAstScanner([detector]);

    it('should flag raw document.getElementById access in test files', () => {
      // Arrange
      const snippet = `
        it("should find element", () => {
          const el = document.getElementById("my-id");
          expect(el).toBeTruthy();
        });
      `;

      // Act
      const violations = scanner.scan(snippet, 'test-dummy.test.ts');

      // Assert
      expect(violations).toHaveLength(1);
      expect(violations[0].target).toBe('document.getElementById');
      expect(violations[0].message).toContain('Use semantic queries');
    });

    it('should allow testing-library queries instead of raw getElementById', () => {
      // Arrange
      const snippet = `
        it("should find element via role", () => {
          const el = screen.getByRole("button");
          expect(el).toBeTruthy();
        });
      `;

      // Act
      const violations = scanner.scan(snippet, 'test-dummy.test.ts');

      // Assert
      expect(violations).toHaveLength(0);
    });
  });

  describe('Architecture: Full Test Suite Scan', () => {
    let graph: ModuleGraph;
    const rule = new TestGovernanceRule();

    beforeAll(() => {
      // Arrange
      const testsRoot = path.resolve(__dirname, '../../../tests');
      graph = DependencyGraphBuilder.buildGraph(testsRoot);
    });

    it('should not contain snake_case test names or raw document.getElementById outside migration allowlist', () => {
      // Act
      const violations = rule.check(graph, { allowlist: TEST_GOVERNANCE_ALLOWLIST });

      // Assert
      if (violations.length > 0) {
        const details = violations
          .map(v => `  - [${v.file}:${v.line ?? '?'}] ${v.message}`)
          .join('\n');
        expect.fail(
          `Found ${violations.length} test governance violation(s):\n${details}\n` +
          `Ensure test names use sentence/camelCase format and DOM access uses semantic Testing Library queries.`
        );
      }

      expect(violations).toHaveLength(0);
    });
  });
});
