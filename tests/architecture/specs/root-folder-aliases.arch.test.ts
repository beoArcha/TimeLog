import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { RootFolderAliasesRule } from '../rules/root-folder-aliases.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Root Folder Aliases', () => {
  let graph: ModuleGraph;
  const rule = new RootFolderAliasesRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should use path aliases when importing across top-level src/ root folders', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations.map(v => `  - [Line ${v.line ?? '?'}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} root folder boundary violation(s) in src/:\n${details}\n` +
        `Relative imports across top-level folders (common, plugins, features, etc.) are forbidden. Use aliases instead.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
