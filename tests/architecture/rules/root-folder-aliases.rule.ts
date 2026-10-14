import { ArchitectureRule, ModuleGraph, RuleViolation } from '../core/types';
import { PathResolver } from '../core/path-resolver';

/**
 * Architectural Rule: Root Folder Boundaries & Mandatory Aliases
 * Enforces that any import targeting another top-level root folder in src/
 * must use the configured path alias (e.g. @plugins/*, @features/*) instead of
 * relative paths crossing module boundaries.
 */
export class RootFolderAliasesRule implements ArchitectureRule {
  public readonly name = 'root-folder-aliases';
  public readonly description = 'Enforces path aliases when importing across top-level src/ root folders.';

  private readonly resolver = new PathResolver();

  public check(graph: ModuleGraph): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      for (const imp of node.imports) {
        if (imp.isRelative && imp.resolvedPath) {
          const isCross = this.resolver.isCrossTopLevelBoundary(nodeId, imp.resolvedPath);
          if (isCross) {
            const suggested = this.resolver.getSuggestedAlias(imp.resolvedPath);
            violations.push({
              rule: this.name,
              file: nodeId,
              line: imp.lineNumber,
              target: imp.resolvedPath,
              message: `File "${nodeId}" (in "${node.topLevelDir}") imports from "${imp.specifier}" crossing top-level boundaries. Use alias "${suggested}" instead.`,
            });
          }
        }
      }
    }

    return violations;
  }
}
