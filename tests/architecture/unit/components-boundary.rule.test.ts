import { describe, it, expect } from 'vitest';
import { ComponentsBoundaryRule } from '../rules/components-boundary.rule';
import { DependencyGraphBuilder } from '../core/dependency-graph';

describe('Unit Tests: ComponentsBoundaryRule', () => {
  const rule = new ComponentsBoundaryRule();

  it('should allow components importing only top-level types, UI primitives, and safe utilities', () => {
    // Arrange
    const mockSources = {
      'components/SyncStatusBadge.tsx': `
import React from 'react';
import { Badge } from '@components/ui/badge';
import type { SyncStateType } from '@common/types/sync';
import { translate } from '@common/i18n/translator';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('should detect forbidden coupling when a component imports from common/sinks', () => {
    // Arrange
    const mockSources = {
      'components/SyncStatusBadge.tsx': `
import React from 'react';
import { WebhookDispatcher } from '@common/sinks/WebhookDispatcher';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toBe('components/SyncStatusBadge.tsx');
    expect(violations[0].target).toBe('@common/sinks/WebhookDispatcher');
  });

  it('should detect forbidden coupling when a component imports from plugins or engine', () => {
    // Arrange
    const mockSources = {
      'components/CustomTimer.tsx': `
import React from 'react';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].target).toBe('@plugins/engine/EnginePlugin');
  });

  it('should detect forbidden coupling when a component imports from features or layouts', () => {
    // Arrange
    const mockSources = {
      'components/CardHeader.tsx': `
import React from 'react';
import { TaskListView } from '@features/tasks/TaskListView';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].target).toBe('@features/tasks/TaskListView');
  });

  it('should ignore imports in non-component files', () => {
    // Arrange
    const mockSources = {
      'layouts/components/DaemonStatusBar.tsx': `
import { WebhookDispatcher } from '@common/sinks/WebhookDispatcher';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(0);
  });
});
