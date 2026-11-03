import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import {
  JsxContentModelRule,
  LEGACY_JSX_CONTENT_MODEL_ALLOWLIST,
} from '../rules/jsx-content-model.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: JSX Structural Constraints', () => {
  let graph: ModuleGraph;
  let srcRoot: string;
  const rule = new JsxContentModelRule();

  beforeAll(() => {
    srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('enforces supported JSX structural constraints across views with legacy migration allowlist', () => {
    const violations = rule.check(graph);

    if (violations.length > 0) {
      const details = violations
        .map(v => `  - [${v.file}:${v.line}] ${v.message}`)
        .join('\n');
      expect.fail(
        `Found ${violations.length} JSX content model violation(s):\n${details}\n` +
          `Ensure child elements conform to supported structural constraints and Design System contracts.`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('verifies that composite components in src/components/ strictly conform to content models', () => {
    const violations = rule
      .check(graph, { allowlist: new Set() })
      .filter(
        v =>
          v.file.startsWith('components/') &&
          !v.file.startsWith('components/ui/')
      );

    if (violations.length > 0) {
      const details = violations
        .map(v => `  - [${v.file}:${v.line}] ${v.message}`)
        .join('\n');
      expect.fail(
        `Found ${violations.length} content model violation(s) in src/components/:\n${details}`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('ensures all allowlisted files exist in the project repository', () => {
    for (const relativePath of LEGACY_JSX_CONTENT_MODEL_ALLOWLIST) {
      const fullPath = path.join(srcRoot, relativePath);
      expect(
        fs.existsSync(fullPath),
        `Allowlist contains non-existent file: ${relativePath}`
      ).toBe(true);
    }
  });
});
