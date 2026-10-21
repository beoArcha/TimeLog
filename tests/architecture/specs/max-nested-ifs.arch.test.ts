import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { MaxNestedIfsRule, NESTED_IFS_MIGRATION_ALLOWLIST } from '../rules/max-nested-ifs.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Rule of 3 Nested Ifs Governance', () => {
  let graph: ModuleGraph;
  const rule = new MaxNestedIfsRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not contain if statements nested 3 or more levels deep outside migration allowlist', () => {
    const violations = rule.check(graph, { allowlist: NESTED_IFS_MIGRATION_ALLOWLIST });

    if (violations.length > 0) {
      const details = violations.map((v) => `  - [${v.file}:${v.line}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} nested if statement violation(s) exceeding max depth 2:\n${details}\n` +
          `Refactor deeply nested code using early returns / guard clauses or extract helper methods.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
