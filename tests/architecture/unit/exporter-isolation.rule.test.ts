import { describe, it, expect } from 'vitest';
import { ExporterIsolationRule } from '../rules/exporter-isolation.rule';
import { DependencyGraphBuilder } from '../core/dependency-graph';

describe('Unit Tests: ExporterIsolationRule', () => {
  const rule = new ExporterIsolationRule();

  it('should allow exporter modules importing only contracts, internal helpers, and schemas', () => {
    // Arrange
    const mockSources = {
      'plugins/exporters/CustomCsvExporterPlugin.ts': `
import { ExportPayload, IExporterPlugin } from '../contracts/IExporterPlugin';
import { sanitizeXml10, escapeXml } from './xmlSanitizer';
import { createUncompressedZip } from './zipBuilder';
import reportSchema from '../../../schemas/xml/report/v1/report.xsd?raw';

export class CustomCsvExporterPlugin implements IExporterPlugin {
  readonly id = 'custom-csv';
  readonly name = 'Custom CSV';
  export(payload: ExportPayload): string {
    return payload.report.title;
  }
}
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('should detect forbidden coupling when an exporter imports from @common/engine or EngineRouter', () => {
    // Arrange
    const mockSources = {
      'plugins/exporters/CsvExporter.ts': `
import { EngineRouter } from '@common/engine/EngineRouter';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toBe('plugins/exporters/CsvExporter.ts');
    expect(violations[0].target).toBe('@common/engine/EngineRouter');
    expect(violations[0].message).toContain('Forbidden exporter coupling');
  });

  it('should detect forbidden coupling when an exporter imports from @common/persistence or PersistenceRouter', () => {
    // Arrange
    const mockSources = {
      'plugins/exporters/JsonExporter.ts': `
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toBe('plugins/exporters/JsonExporter.ts');
    expect(violations[0].target).toBe('@common/persistence/PersistenceRouter');
  });

  it('should detect forbidden coupling when an exporter imports from src/plugins/engine or @plugins/engine', () => {
    // Arrange
    const mockSources = {
      'plugins/exporters/XlsxExporter.ts': `
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toBe('plugins/exporters/XlsxExporter.ts');
    expect(violations[0].target).toBe('@plugins/engine/EnginePlugin');
  });

  it('should detect forbidden coupling when an exporter imports from src/plugins/persistence or @plugins/persistence', () => {
    // Arrange
    const mockSources = {
      'plugins/exporters/OdsExporter.ts': `
import { PersistencePlugin } from 'src/plugins/persistence/PersistencePlugin';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toBe('plugins/exporters/OdsExporter.ts');
    expect(violations[0].target).toBe('src/plugins/persistence/PersistencePlugin');
  });

  it('should detect forbidden coupling when an exporter imports relative engine or persistence paths', () => {
    // Arrange
    const mockSources = {
      'plugins/exporters/XmlExporter.ts': `
import { EnginePlugin } from '../engine/EnginePlugin';
import { PersistencePlugin } from '../persistence/PersistencePlugin';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(2);
    expect(violations.map((v) => v.target)).toEqual([
      '../engine/EnginePlugin',
      '../persistence/PersistencePlugin',
    ]);
  });

  it('should detect forbidden coupling when an exporter imports @tauri-apps packages', () => {
    // Arrange
    const mockSources = {
      'plugins/exporters/HtmlExporter.ts': `
import { invoke } from '@tauri-apps/api/core';
import { writeFile } from '@tauri-apps/plugin-fs';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(2);
    expect(violations[0].target).toBe('@tauri-apps/api/core');
    expect(violations[1].target).toBe('@tauri-apps/plugin-fs');
  });

  it('should ignore imports in non-exporter modules', () => {
    // Arrange
    const mockSources = {
      'features/reports/ReportsView.tsx': `
import { EngineRouter } from '@common/engine/EngineRouter';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act
    const violations = rule.check(graph);

    // Assert
    expect(violations).toHaveLength(0);
  });

  it('should throw an error when requireTargetFiles is true and no exporter files are present', () => {
    // Arrange
    const mockSources = {
      'features/reports/ReportsView.tsx': `
import React from 'react';
`,
    };
    const graph = DependencyGraphBuilder.buildFromSources(mockSources);

    // Act & Assert
    expect(() => rule.check(graph, { requireTargetFiles: true })).toThrow(
      'Architecture Violation: Expected to find and scan exporter files in "plugins/exporters/", but 0 were found.'
    );
  });
});
