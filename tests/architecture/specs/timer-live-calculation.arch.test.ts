import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { TimerLiveCalculationRule } from '../rules/timer-live-calculation.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Live Timer Calculation (Single Source of Truth)', () => {
  let graph: ModuleGraph;
  const rule = new TimerLiveCalculationRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not call setInterval in UI components or layouts (must use useLiveTaskElapsed/useLiveProjectElapsed)', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations.map(v => `  - [Line ${v.line ?? '?'}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} custom setInterval ticker(s) in UI:\n${details}\n` +
        `Components must use useLiveTaskElapsed or useLiveProjectElapsed for unified time reckoning.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
