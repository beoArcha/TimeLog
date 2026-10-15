import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { RuntimeIsolationRule } from '../rules/runtime-isolation.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Runtime Isolation', () => {
  let graph: ModuleGraph;
  const rule = new RuntimeIsolationRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not leak @tauri-apps/* imports into shared UI components, layouts or plugins', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations.map(v => `  - [Line ${v.line ?? '?'}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} runtime leakage violation(s) in src/:\n${details}\n` +
        `Direct @tauri-apps/* imports are only permitted in app-tauri/ and common/tauri/ native adapters.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
