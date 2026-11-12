import { ArchitectureRule, ImportDeclarationInfo, ModuleGraph, RuleViolation } from '../core/types';

/**
 * Detects whether an import declaration targets storage, engine, routers, or Tauri APIs.
 */
export function detectForbiddenExporterImport(imp: ImportDeclarationInfo): string | null {
  const specifier = imp.specifier.replace(/\\/g, '/');
  const resolved = imp.resolvedPath?.replace(/\\/g, '/') ?? null;

  if (specifier === '@tauri-apps' || specifier.startsWith('@tauri-apps/')) {
    return specifier;
  }

  if (
    specifier.startsWith('@common/engine') ||
    specifier.startsWith('src/plugins/engine') ||
    specifier.startsWith('@plugins/engine') ||
    specifier.includes('/common/engine') ||
    specifier.includes('/plugins/engine')
  ) {
    return specifier;
  }

  if (
    specifier.startsWith('@common/persistence') ||
    specifier.startsWith('src/plugins/persistence') ||
    specifier.startsWith('@plugins/persistence') ||
    specifier.includes('/common/persistence') ||
    specifier.includes('/plugins/persistence')
  ) {
    return specifier;
  }

  if (resolved) {
    if (resolved.startsWith('common/engine') || resolved.startsWith('plugins/engine')) {
      return specifier;
    }
    if (resolved.startsWith('common/persistence') || resolved.startsWith('plugins/persistence')) {
      return specifier;
    }
  }

  if (
    specifier.startsWith('../engine') ||
    specifier.startsWith('../../common/engine') ||
    specifier.startsWith('../persistence') ||
    specifier.startsWith('../../common/persistence')
  ) {
    return specifier;
  }

  const lowerSpecifier = specifier.toLowerCase();
  if (
    lowerSpecifier.includes('enginerouter') ||
    lowerSpecifier.includes('persistencerouter') ||
    lowerSpecifier.includes('enginecommands') ||
    lowerSpecifier.includes('persistencecommands')
  ) {
    return specifier;
  }

  return null;
}

export interface ExporterIsolationOptions {
  requireTargetFiles?: boolean;
}

/**
 * Architectural Rule: Exporter Isolation Enforcement
 *
 * Forbids files under `src/plugins/exporters/` from importing persistence, engine,
 * their router modules, or Tauri APIs.
 */
export class ExporterIsolationRule implements ArchitectureRule<ExporterIsolationOptions> {
  public readonly name = 'exporter-isolation';
  public readonly description =
    'Forbids exporter modules from importing persistence, engine, router modules, or Tauri APIs.';

  private isTargetFile(nodeId: string): boolean {
    const norm = nodeId.replace(/\\/g, '/');
    return norm.startsWith('plugins/exporters/') || norm.includes('/plugins/exporters/');
  }

  public check(graph: ModuleGraph, options?: ExporterIsolationOptions): RuleViolation[] {
    const violations: RuleViolation[] = [];
    let scannedCount = 0;

    for (const [nodeId, node] of graph.nodes) {
      if (this.isTargetFile(nodeId)) {
        scannedCount += 1;
        for (const imp of node.imports) {
          const forbidden = detectForbiddenExporterImport(imp);
          if (forbidden) {
            violations.push({
              rule: this.name,
              file: nodeId,
              line: imp.lineNumber,
              target: forbidden,
              message: `Forbidden exporter coupling: "${nodeId}" imports forbidden target "${forbidden}". Exporters must remain pure projections of report data without access to storage, engine, or Tauri APIs.`,
            });
          }
        }
      }
    }

    if (options?.requireTargetFiles && scannedCount === 0) {
      throw new Error(
        'Architecture Violation: Expected to find and scan exporter files in "plugins/exporters/", but 0 were found.'
      );
    }

    return violations;
  }
}
