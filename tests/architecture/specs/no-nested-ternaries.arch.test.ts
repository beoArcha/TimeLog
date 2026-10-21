import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { NoNestedTernariesRule, NO_NESTED_TERNARIES_ALLOWLIST } from '../rules/no-nested-ternaries.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: No Nested Ternaries Governance', () => {
  let graph: ModuleGraph;
  const rule = new NoNestedTernariesRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not contain nested ternaries or deep nullish chains outside allowlist', () => {
    const violations = rule.check(graph, { allowlist: NO_NESTED_TERNARIES_ALLOWLIST });

    if (violations.length > 0) {
      const details = violations.map((v) => `  - [${v.file}:${v.line}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} nested ternary violation(s):\n${details}\n` +
          `Refactor nested/chained ternaries into if/else statements, helper functions, or map lookups.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
