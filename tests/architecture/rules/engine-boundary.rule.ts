import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';

/**
 * Architectural Rule: Engine Boundary Enforcement
 * Mandated by docs/ENGINEERING.md:
 * "Business logic and calculations belong exclusively to Engine (IEngine).
 * Common UI hooks and presentation components must never import EnginePlugin
 * or internal plugin calculations directly."
 */
export class EngineBoundaryRule implements ArchitectureRule {
  public readonly name = 'engine-boundary';
  public readonly description = 'Forbids presentation components, layouts, and common hooks from directly importing EnginePlugin or internal plugin elapsed calculations.';

  public check(graph: ModuleGraph): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      const normalizedPath = nodeId.replace(/\\/g, '/');
      const isTargetDir =
        node.topLevelDir === 'components' ||
        node.topLevelDir === 'layouts' ||
        normalizedPath.includes('/common/hooks/') ||
        normalizedPath.includes('/features/tasks/hooks/') ||
        normalizedPath.includes('/features/reports/');

      if (isTargetDir) {
        for (const imp of node.imports) {
          const specifier = imp.specifier.toLowerCase().replace(/\\/g, '/');
          if (
            specifier.includes('plugins/engine/elapsed') ||
            specifier.includes('plugins/engine/engineplugin')
          ) {
            violations.push({
              rule: this.name,
              file: nodeId,
              line: imp.lineNumber,
              target: imp.specifier,
              message: `Forbidden engine coupling: "${nodeId}" directly imports "${imp.specifier}". Presentation layers and hooks must consume EngineRouter or metrics snapshots.`,
            });
          }
        }
      }
    }

    return violations;
  }
}
