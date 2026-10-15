import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { EngineBoundaryRule } from '../rules/engine-boundary.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Engine Boundary Enforcement', () => {
  let graph: ModuleGraph;
  const rule = new EngineBoundaryRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not leak EnginePlugin or internal plugin elapsed calculations into presentation layers or hooks', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations.map(v => `  - [Line ${v.line ?? '?'}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} engine coupling violation(s) in UI/hooks:\n${details}\n` +
        `Presentation layers and hooks must consume EngineRouter or metrics snapshots.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
