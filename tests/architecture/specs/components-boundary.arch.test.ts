import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { ComponentsBoundaryRule } from '../rules/components-boundary.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Components Boundary Enforcement', () => {
  let graph: ModuleGraph;
  const rule = new ComponentsBoundaryRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not leak sinks, persistence, engine, plugins, features, or layouts into src/components/', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations.map(v => `  - [Line ${v.line ?? '?'}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} components boundary violation(s) in src/components/:\n${details}\n` +
        `Shared components in src/components/ must only depend on top-level types (@common/types/, @bindings/) and safe UI primitives.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
