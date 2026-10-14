import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { CircularDependenciesRule } from '../rules/circular-dependencies.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Circular Dependencies', () => {
  let graph: ModuleGraph;
  const rule = new CircularDependenciesRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should have zero circular dependencies across all components and modules in src/', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations.map(v => `  - ${v.message}`).join('\n');
      expect.fail(`Found ${violations.length} circular dependency cycle(s) in src/:\n${details}`);
    }

    expect(violations).toHaveLength(0);
  });
});
