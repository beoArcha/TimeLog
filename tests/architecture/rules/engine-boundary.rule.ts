import { ArchitectureRule, ModuleGraph, RuleViolation } from "../core/types";

/**
 * Architectural Rule: Engine Boundary Enforcement
 */
export class EngineBoundaryRule implements ArchitectureRule {
  public readonly name = "engine-boundary";
  public readonly description =
    "Forbids presentation components, layouts, and common hooks from directly importing EnginePlugin or internal plugin elapsed calculations.";

  public check(graph: ModuleGraph): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      const normalizedPath = nodeId.replace(/\\/g, "/");
      const isTargetDir =
        node.topLevelDir === "components" ||
        node.topLevelDir === "layouts" ||
        normalizedPath.includes("/common/hooks/") ||
        normalizedPath.includes("/features/tasks/hooks/") ||
        normalizedPath.includes("/features/reports/");

      if (isTargetDir) {
        for (const imp of node.imports) {
          const specifier = imp.specifier.toLowerCase().replace(/\\/g, "/");
          if (
            specifier.includes("plugins/engine/elapsed") ||
            specifier.includes("plugins/engine/engineplugin") ||
            specifier.includes("plugins/engine/validation") ||
            specifier.includes("plugins/engine/services")
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
