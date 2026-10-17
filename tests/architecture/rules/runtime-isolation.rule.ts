import { ArchitectureRule, ModuleGraph, RuleViolation } from "../core/types";

/**
 * Architectural Rule: Runtime Isolation (Tauri API Leakage Prevention)
 *
 * Forbids direct imports of @tauri-apps/* in shared UI layers (components, layouts, features).
 */
export class RuntimeIsolationRule implements ArchitectureRule {
  public readonly name = "runtime-isolation";
  public readonly description =
    "Forbids @tauri-apps/* imports inside shared presentation components and layouts.";

  private readonly forbiddenTopLevelDirs = new Set([
    "components",
    "layouts",
    "features",
    "plugins",
  ]);

  public check(graph: ModuleGraph): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      if (this.forbiddenTopLevelDirs.has(node.topLevelDir)) {
        for (const imp of node.imports) {
          if (imp.specifier.startsWith("@tauri-apps/")) {
            violations.push({
              rule: this.name,
              file: nodeId,
              line: imp.lineNumber,
              target: imp.specifier,
              message: `Forbidden runtime leak: File "${nodeId}" inside "${node.topLevelDir}" imports "${imp.specifier}". Shared components must remain runtime-independent.`,
            });
          }
        }
      }
    }

    return violations;
  }
}
