import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { DependencyGraphBuilder } from '../core/dependency-graph';
import { ExporterIsolationRule } from '../rules/exporter-isolation.rule';
import { ModuleGraph } from '../core/types';

describe('Architecture: Exporter Isolation Enforcement', () => {
  let graph: ModuleGraph;
  const rule = new ExporterIsolationRule();

  beforeAll(() => {
    const srcRoot = path.resolve(__dirname, '../../../src');
    graph = DependencyGraphBuilder.buildGraph(srcRoot);
  });

  it('should find and scan exporter files in plugins/exporters/', () => {
    const exporterNodes = Array.from(graph.nodes.keys()).filter((nodeId) => {
      const norm = nodeId.replace(/\\/g, '/');
      return norm.startsWith('plugins/exporters/') || norm.includes('/plugins/exporters/');
    });

    expect(
      exporterNodes.length,
      'Expected to find and scan exporter files in "plugins/exporters/", but 0 were found in the module graph.'
    ).toBeGreaterThan(0);
  });

  it('should keep exporter modules isolated from storage, engine, and tauri APIs', () => {
    const exporterNodes = Array.from(graph.nodes.keys()).filter((nodeId) => {
      const norm = nodeId.replace(/\\/g, '/');
      return norm.startsWith('plugins/exporters/') || norm.includes('/plugins/exporters/');
    });
    expect(
      exporterNodes.length,
      'Expected to find and scan exporter files in "plugins/exporters/", but 0 were found in the module graph.'
    ).toBeGreaterThan(0);

    const violations = rule.check(graph, { requireTargetFiles: true });

    if (violations.length > 0) {
      const details = violations.map((v) => `  - [Line ${v.line ?? '?'}] ${v.message}`).join('\n');
      expect.fail(
        `Found ${violations.length} exporter isolation violation(s):\n${details}\n` +
          `Exporter modules must be pure projections of report data and never reach storage, engine or Tauri.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
