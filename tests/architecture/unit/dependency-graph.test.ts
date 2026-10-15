import { describe, it, expect } from 'vitest';
import { DependencyGraphBuilder } from '../core/dependency-graph';

describe('DependencyGraphBuilder (Unit Tests)', () => {
  it('should build graph nodes and directed adjacency edges correctly', () => {
    const mockSources = {
      'common/engine/EngineRouter.ts': `
import { IEngine } from './IEngine';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
`,
      'common/engine/IEngine.ts': `
export interface IEngine {}
`,
      'plugins/engine/EnginePlugin.ts': `
import { IEngine } from '@common/engine/IEngine';
`,
    };

    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    expect(graph.nodes.size).toBe(3);
    expect(graph.nodes.has('common/engine/EngineRouter.ts')).toBe(true);
    expect(graph.nodes.has('common/engine/IEngine.ts')).toBe(true);
    expect(graph.nodes.has('plugins/engine/EnginePlugin.ts')).toBe(true);

    const routerEdges = graph.adjacencyList.get('common/engine/EngineRouter.ts');
    expect(routerEdges).toBeDefined();
    expect(routerEdges!.has('common/engine/IEngine.ts')).toBe(true);
    expect(routerEdges!.has('plugins/engine/EnginePlugin.ts')).toBe(true);

    const pluginEdges = graph.adjacencyList.get('plugins/engine/EnginePlugin.ts');
    expect(pluginEdges).toBeDefined();
    expect(pluginEdges!.has('common/engine/IEngine.ts')).toBe(true);
  });

  it('should ignore self-imports and external packages in edges', () => {
    const mockSources = {
      'components/Button.tsx': `
import React from 'react';
import { LucideIcon } from 'lucide-react';
`,
    };

    const graph = DependencyGraphBuilder.buildFromSources(mockSources);
    expect(graph.nodes.size).toBe(1);
    const edges = graph.adjacencyList.get('components/Button.tsx');
    expect(edges?.size).toBe(0);
  });
});
