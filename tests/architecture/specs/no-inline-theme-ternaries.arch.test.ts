import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { NoInlineThemeTernariesRule, THEME_TERNARY_ALLOWLIST } from '../rules/no-inline-theme-ternaries.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: No Inline Theme Ternaries Enforcement', () => {
  let graph: ModuleGraph;
  const rule = new NoInlineThemeTernariesRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not contain inline theme checks outside migration allowlist', () => {
    const violations = rule.check(graph, { allowlist: THEME_TERNARY_ALLOWLIST });

    if (violations.length > 0) {
      const details = violations.map(v => `  - [${v.file}:${v.line}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} forbidden inline theme comparison(s):\n${details}\n` +
        `Rely on CSS variables or theme DIP abstractions in src/styles/.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
