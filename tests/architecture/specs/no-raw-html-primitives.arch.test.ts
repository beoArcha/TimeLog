import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { NoRawHtmlPrimitivesRule } from '../rules/no-raw-html-primitives.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Design System Primitive Enforcement', () => {
  let graph: ModuleGraph;
  const rule = new NoRawHtmlPrimitivesRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should not contain raw HTML primitives outside components/ui/ (zero allowlist enforced)', () => {
    const violations = rule.check(graph, { allowlist: new Set() });

    if (violations.length > 0) {
      const details = violations.map(v => `  - [${v.file}:${v.line}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} forbidden raw HTML primitive(s) outside components/ui/:\n${details}\n` +
        `Use Design System primitives (@components/ui/*) or composite components (@components/*).`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('composite components in src/components/ must have ZERO raw HTML primitives', () => {
    // Composite components must strictly never use raw HTML tags, regardless of allowlist
    const violations = rule.check(graph, { allowlist: new Set() }).filter(v =>
      v.file.startsWith('components/') && !v.file.startsWith('components/ui/')
    );

    if (violations.length > 0) {
      const details = violations.map(v => `  - [${v.file}:${v.line}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} forbidden raw HTML primitive(s) in src/components/:\n${details}`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
