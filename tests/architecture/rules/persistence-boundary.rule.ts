import { ArchitectureRule, ModuleGraph, RuleViolation } from "../core/types";

/**
 * Architectural Rule: Persistence Boundary Enforcement
 *
 * Forbids direct imports of PersistencePlugin or low-level storage managers in presentation components.
 */
export class PersistenceBoundaryRule implements ArchitectureRule {
  public readonly name = "persistence-boundary";
  public readonly description =
    "Forbids presentation components from directly importing PersistencePlugin or storage managers.";

  private readonly presentationDirs = new Set(["components", "layouts"]);

  public check(graph: ModuleGraph): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      if (this.presentationDirs.has(node.topLevelDir)) {
        for (const imp of node.imports) {
          const specifier = imp.specifier.toLowerCase();
          if (
            specifier.includes("persistenceplugin") ||
            specifier.includes("datamanager") ||
            specifier.includes("persistencecommands")
          ) {
            violations.push({
              rule: this.name,
              file: nodeId,
              line: imp.lineNumber,
              target: imp.specifier,
              message: `Forbidden direct storage coupling: "${nodeId}" directly imports "${imp.specifier}". Presentation components must access data via DataContext or hooks.`,
            });
          }
        }
      }
    }

    return violations;
  }
}
