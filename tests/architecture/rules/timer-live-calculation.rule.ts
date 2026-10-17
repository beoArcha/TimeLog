import fs from "fs";
import { ArchitectureRule, ModuleGraph, RuleViolation } from "../core/types";

/**
 * Architectural Rule: Single Source of Truth for Live Elapsed Time
 */
export class TimerLiveCalculationRule implements ArchitectureRule {
  public readonly name = "timer-live-calculation";
  public readonly description =
    "Forbids custom setInterval timer tickers in UI components and layouts.";

  private readonly targetDirs = new Set(["components", "layouts"]);

  public check(graph: ModuleGraph): RuleViolation[] {
    const violations: RuleViolation[] = [];

    for (const [nodeId, node] of graph.nodes) {
      if (
        this.targetDirs.has(node.topLevelDir) &&
        (nodeId.endsWith(".tsx") || nodeId.endsWith(".ts"))
      ) {
        const fileContent = fs.readFileSync(node.absolutePath, "utf-8");
        // Match setInterval invocation (excluding comments)
        const lines = fileContent.split("\n");
        lines.forEach((lineText, idx) => {
          const trimmed = lineText.trim();
          if (
            trimmed.startsWith("//") ||
            trimmed.startsWith("*") ||
            trimmed.startsWith("/*")
          ) {
            return;
          }
          if (/\bsetInterval\s*\(/.test(lineText)) {
            violations.push({
              rule: this.name,
              file: nodeId,
              line: idx + 1,
              message: `Forbidden custom timer ticker: "${nodeId}" calls setInterval on line ${idx + 1}. Use useLiveTaskElapsed or useLiveProjectElapsed instead.`,
            });
          }
        });
      }
    }

    return violations;
  }
}
