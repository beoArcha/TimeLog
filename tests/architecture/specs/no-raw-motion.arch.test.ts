import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { NoRawMotionRule } from '../rules/no-raw-motion.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Motion Primitive Encapsulation', () => {
  let graph: ModuleGraph;
  const rule = new NoRawMotionRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not contain raw motion primitives outside components composite wrappers', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations.map(v => `  - [${v.file}:${v.line}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} forbidden raw motion primitive(s) outside components/:\n${details}\n` +
        `Use Design System animation composites (@components/AnimatedCard, @components/AnimatedFade, etc.).`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
