import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { PersistenceBoundaryRule } from '../rules/persistence-boundary.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Persistence Boundary Enforcement', () => {
  let graph: ModuleGraph;
  const rule = new PersistenceBoundaryRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not couple presentation components directly to PersistencePlugin or storage managers', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations.map(v => `  - [Line ${v.line ?? '?'}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} persistence coupling violation(s) in UI components:\n${details}\n` +
        `Presentation components must consume DataContext or high-level hooks.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
