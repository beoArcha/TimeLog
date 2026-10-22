import { ArchitectureRule, ModuleGraph, RuleViolation, ImportDeclarationInfo } from "../core/types";

/**
 * Architectural Rule: Components Boundary Enforcement
 *
 * Forbids shared presentation components (src/components/) from depending on lower-level
 * application layers (sinks, persistence, engine, workflows, plugins, features, layouts).
 * Shared components may only depend on top-level contracts (@common/types/, @bindings/),
 * UI primitives (@components/ui/), i18n, utilities, and safe context helpers (LocaleProvider).
 */
export class ComponentsBoundaryRule implements ArchitectureRule {
  public readonly name = "components-boundary";
  public readonly description =
    "Forbids src/components/ from importing sinks, persistence, engine, plugins, features, or layouts.";

  private readonly forbiddenPatterns: readonly string[] = [
    "common/sinks",
    "common/persistence",
    "common/engine",
    "common/workflows",
    "plugins/",
    "features/",
    "layouts/",
    "app-tauri",
    "app-browser",
  ];

  public check(graph: ModuleGraph): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      if (node.topLevelDir !== "components") {
        continue;
      }

      for (const imp of node.imports) {
        const violation = this.evaluateImport(nodeId, imp);
        if (violation) {
          violations.push(violation);
        }
      }
    }

    return violations;
  }

  private evaluateImport(sourceFile: string, imp: ImportDeclarationInfo): RuleViolation | null {
    const specifier = imp.specifier.toLowerCase().replace(/\\/g, "/");
    const resolvedPath = (imp.resolvedPath ?? "").toLowerCase().replace(/\\/g, "/");

    const matchedForbidden = this.forbiddenPatterns.find(
      pattern => specifier.includes(pattern) || resolvedPath.includes(pattern)
    );

    if (!matchedForbidden) {
      return null;
    }

    return {
      rule: this.name,
      file: sourceFile,
      line: imp.lineNumber,
      target: imp.specifier,
      message: `Forbidden architectural coupling: "${sourceFile}" imports "${imp.specifier}". Presentation components in src/components/ must not depend on ${matchedForbidden} and may only consume top-level types (@common/types/, @bindings/).`,
    };
  }
}
